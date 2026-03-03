pub mod instructions;
pub mod state;
pub mod errors;
pub mod ed25519;

use anchor_lang::prelude::*;
use instructions::*;

declare_id!("VLT111111111111111111111111111111111111111");

#[program]
pub mod propsim_vault {
    use super::*;

    /// Initialize the vault configuration PDA.
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        propsim_signer: Pubkey,
        usdc_mint: Pubkey,
        enable_daily_cap: bool,
        daily_cap_usdc: u64,
        domain: [u8; 16],
    ) -> Result<()> {
        instructions::initialize_config::handler(
            ctx,
            propsim_signer,
            usdc_mint,
            enable_daily_cap,
            daily_cap_usdc,
            domain,
        )
    }

    /// Initialize the vault authority PDA and its USDC token account.
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        instructions::initialize_vault::handler(ctx)
    }

    /// Update the PropSim claim signer pubkey. Authority only.
    pub fn set_propsim_signer(ctx: Context<SetPropsimSigner>, new_signer: Pubkey) -> Result<()> {
        instructions::set_propsim_signer::handler(ctx, new_signer)
    }

    /// Update daily cap settings. Authority only.
    pub fn set_daily_cap(ctx: Context<SetDailyCap>, enable: bool, cap: u64) -> Result<()> {
        instructions::set_daily_cap::handler(ctx, enable, cap)
    }

    /// Redeem a signed claim. Requires an Ed25519 verify instruction in the same tx.
    pub fn redeem_claim(
        ctx: Context<RedeemClaim>,
        claim_data: ClaimV1Data,
        signature: [u8; 64],
    ) -> Result<()> {
        instructions::redeem_claim::handler(ctx, claim_data, signature)
    }
}
