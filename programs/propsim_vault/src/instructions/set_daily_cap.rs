use anchor_lang::prelude::*;
use crate::state::VaultConfig;
use crate::errors::VaultError;

#[derive(Accounts)]
pub struct SetDailyCap<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ VaultError::Unauthorized,
        seeds = [b"config", authority.key().as_ref()],
        bump,
    )]
    pub config: Account<'info, VaultConfig>,
}

pub fn handler(ctx: Context<SetDailyCap>, enable: bool, cap: u64) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.enable_daily_cap = enable;
    config.daily_cap_usdc = cap;
    msg!("Daily cap updated: enable={}, cap={}", enable, cap);
    Ok(())
}
