use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::VaultConfig;

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority,
        seeds = [b"config", authority.key().as_ref()],
        bump,
    )]
    pub config: Account<'info, VaultConfig>,

    /// CHECK: PDA used as vault authority. Seeds: ["vault", config]
    #[account(
        seeds = [b"vault", config.key().as_ref()],
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,

    /// The vault's USDC token account, owned by the vault_authority PDA.
    #[account(
        init,
        payer = authority,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault_authority,
    )]
    pub vault_usdc: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitializeVault>) -> Result<()> {
    let bump = ctx.bumps.vault_authority;
    let config = &mut ctx.accounts.config;
    config.vault_authority_bump = bump;

    msg!(
        "Vault initialized. vault_authority={}, vault_usdc={}, bump={}",
        ctx.accounts.vault_authority.key(),
        ctx.accounts.vault_usdc.key(),
        bump
    );
    Ok(())
}
