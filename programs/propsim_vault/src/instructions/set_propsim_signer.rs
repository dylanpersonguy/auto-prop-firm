use anchor_lang::prelude::*;
use crate::state::VaultConfig;
use crate::errors::VaultError;

#[derive(Accounts)]
pub struct SetPropsimSigner<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ VaultError::Unauthorized,
        seeds = [b"config", authority.key().as_ref()],
        bump,
    )]
    pub config: Account<'info, VaultConfig>,
}

pub fn handler(ctx: Context<SetPropsimSigner>, new_signer: Pubkey) -> Result<()> {
    ctx.accounts.config.propsim_signer = new_signer;
    msg!("propsim_signer updated to {}", new_signer);
    Ok(())
}
