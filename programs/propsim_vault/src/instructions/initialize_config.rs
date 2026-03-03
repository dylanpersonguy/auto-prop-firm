use anchor_lang::prelude::*;
use crate::state::VaultConfig;

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = VaultConfig::LEN,
        seeds = [b"config", authority.key().as_ref()],
        bump,
    )]
    pub config: Account<'info, VaultConfig>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeConfig>,
    propsim_signer: Pubkey,
    usdc_mint: Pubkey,
    enable_daily_cap: bool,
    daily_cap_usdc: u64,
    domain: [u8; 16],
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.authority = ctx.accounts.authority.key();
    config.propsim_signer = propsim_signer;
    config.usdc_mint = usdc_mint;
    config.vault_authority_bump = 0; // set in initialize_vault
    config.enable_daily_cap = enable_daily_cap;
    config.daily_cap_usdc = daily_cap_usdc;
    config.domain = domain;
    config.version = 1;

    msg!("Config initialized. authority={}", config.authority);
    Ok(())
}
