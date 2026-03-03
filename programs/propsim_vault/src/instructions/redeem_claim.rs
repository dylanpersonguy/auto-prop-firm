use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::instructions as sysvar_instructions;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::ed25519::verify_ed25519_ix;
use crate::errors::VaultError;
use crate::state::{ClaimMarker, UserDay, VaultConfig};

/// Canonical ClaimV1 data passed by the client.
/// Borsh serialization of this struct MUST match the message bytes signed off-chain.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ClaimV1Data {
    pub version: u8,
    pub domain: [u8; 16],
    pub program_id: Pubkey,
    pub config: Pubkey,
    pub claim_id: [u8; 32],
    pub user: Pubkey,
    pub usdc_mint: Pubkey,
    pub amount: u64,
    pub valid_after: i64,
    pub valid_before: i64,
    pub day_id: u32,
    pub daily_cap: u64,
}

impl ClaimV1Data {
    /// Borsh-serialize to bytes. Used to reconstruct the expected message on-chain.
    pub fn to_message_bytes(&self) -> Result<Vec<u8>> {
        let mut buf = Vec::with_capacity(256);
        self.serialize(&mut buf)
            .map_err(|_| error!(VaultError::ArithmeticOverflow))?;
        Ok(buf)
    }
}

#[derive(Accounts)]
#[instruction(claim_data: ClaimV1Data)]
pub struct RedeemClaim<'info> {
    #[account(
        seeds = [b"config", config.authority.as_ref()],
        bump,
    )]
    pub config: Account<'info, VaultConfig>,

    /// CHECK: vault authority PDA. Seeds: ["vault", config]
    #[account(
        seeds = [b"vault", config.key().as_ref()],
        bump = config.vault_authority_bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    /// Vault USDC token account (source of funds).
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault_authority,
    )]
    pub vault_usdc: Account<'info, TokenAccount>,

    /// The user / trader wallet signing the tx.
    #[account(mut)]
    pub user: Signer<'info>,

    /// User's USDC ATA (destination). Created if missing.
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = usdc_mint,
        associated_token::authority = user,
    )]
    pub user_usdc: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    /// ClaimMarker PDA for replay protection.
    #[account(
        init,
        payer = user,
        space = ClaimMarker::LEN,
        seeds = [b"claim", config.key().as_ref(), claim_data.claim_id.as_ref()],
        bump,
    )]
    pub claim_marker: Account<'info, ClaimMarker>,

    /// UserDay PDA for daily cap. Only mutated if daily cap is enabled.
    /// Using init_if_needed so it's created on first claim of the day.
    #[account(
        init_if_needed,
        payer = user,
        space = UserDay::LEN,
        seeds = [
            b"day",
            config.key().as_ref(),
            user.key().as_ref(),
            &claim_data.day_id.to_le_bytes(),
        ],
        bump,
    )]
    pub user_day: Account<'info, UserDay>,

    /// Instructions sysvar for Ed25519 verification introspection.
    /// CHECK: This is the instructions sysvar.
    #[account(address = sysvar_instructions::ID)]
    pub instructions_sysvar: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RedeemClaim>,
    claim_data: ClaimV1Data,
    signature: [u8; 64],
) -> Result<()> {
    let config = &ctx.accounts.config;
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // ── 1. Validate claim fields match on-chain state ──
    require!(
        claim_data.domain == config.domain,
        VaultError::DomainMismatch
    );
    require!(
        claim_data.program_id == crate::ID,
        VaultError::ProgramIdMismatch
    );
    require!(
        claim_data.config == config.key(),
        VaultError::ConfigMismatch
    );
    require!(
        claim_data.usdc_mint == config.usdc_mint,
        VaultError::MintMismatch
    );
    require!(
        claim_data.user == ctx.accounts.user.key(),
        VaultError::UserMismatch
    );

    // ── 2. Time validity ──
    require!(now >= claim_data.valid_after, VaultError::ClaimNotYetValid);
    require!(now <= claim_data.valid_before, VaultError::ClaimExpired);

    // ── 3. Reconstruct expected message and verify Ed25519 ix ──
    let expected_message = claim_data.to_message_bytes()?;
    let signer_bytes: [u8; 32] = config.propsim_signer.to_bytes();

    verify_ed25519_ix(
        &ctx.accounts.instructions_sysvar,
        &signer_bytes,
        &expected_message,
        &signature,
    )?;

    // ── 4. Daily cap enforcement ──
    if config.enable_daily_cap {
        let user_day = &mut ctx.accounts.user_day;
        // Initialize if fresh
        if user_day.day_id == 0 && user_day.claimed == 0 {
            user_day.day_id = claim_data.day_id;
            user_day.user = ctx.accounts.user.key();
        }
        let new_claimed = user_day
            .claimed
            .checked_add(claim_data.amount)
            .ok_or(VaultError::ArithmeticOverflow)?;
        require!(
            new_claimed <= config.daily_cap_usdc,
            VaultError::DailyCapExceeded
        );
        user_day.claimed = new_claimed;
    }

    // ── 5. Transfer USDC from vault -> user ──
    let config_key = config.key();
    let seeds: &[&[u8]] = &[
        b"vault",
        config_key.as_ref(),
        &[config.vault_authority_bump],
    ];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_usdc.to_account_info(),
                to: ctx.accounts.user_usdc.to_account_info(),
                authority: ctx.accounts.vault_authority.to_account_info(),
            },
            &[seeds],
        ),
        claim_data.amount,
    )?;

    // ── 6. Mark claim as used ──
    let marker = &mut ctx.accounts.claim_marker;
    marker.used = true;
    marker.redeemed_at = now;
    marker.amount = claim_data.amount;
    marker.user = ctx.accounts.user.key();
    marker.payout_id_hash = [0u8; 32]; // optional, filled client-side if needed

    msg!(
        "Claim redeemed: user={}, amount={}, claim_id={:?}",
        ctx.accounts.user.key(),
        claim_data.amount,
        &claim_data.claim_id[..8]
    );

    Ok(())
}
