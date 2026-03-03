use anchor_lang::prelude::*;

/// Vault configuration PDA.
/// Seeds: ["config", authority_pubkey]
#[account]
#[derive(Default)]
pub struct VaultConfig {
    /// The authority (admin) that can change config.
    pub authority: Pubkey,
    /// Ed25519 public key used by PropSim to sign claims.
    pub propsim_signer: Pubkey,
    /// SPL USDC mint address.
    pub usdc_mint: Pubkey,
    /// Bump for the vault authority PDA.
    pub vault_authority_bump: u8,
    /// Whether daily cap enforcement is enabled.
    pub enable_daily_cap: bool,
    /// Daily cap in USDC base units (6 decimals).
    pub daily_cap_usdc: u64,
    /// Domain tag for claim messages (padded/truncated to 16 bytes).
    pub domain: [u8; 16],
    /// Config version for future upgrades.
    pub version: u8,
}

impl VaultConfig {
    pub const LEN: usize = 8 // discriminator
        + 32  // authority
        + 32  // propsim_signer
        + 32  // usdc_mint
        + 1   // vault_authority_bump
        + 1   // enable_daily_cap
        + 8   // daily_cap_usdc
        + 16  // domain
        + 1;  // version
}

/// Claim marker PDA for replay protection.
/// Seeds: ["claim", config_pda, claim_id_32_bytes]
#[account]
#[derive(Default)]
pub struct ClaimMarker {
    /// Whether this claim has been used.
    pub used: bool,
    /// Timestamp when the claim was redeemed.
    pub redeemed_at: i64,
    /// Amount in USDC base units.
    pub amount: u64,
    /// The user wallet that redeemed.
    pub user: Pubkey,
    /// Hash of the payout ID from PropSim (optional, for audit).
    pub payout_id_hash: [u8; 32],
}

impl ClaimMarker {
    pub const LEN: usize = 8  // discriminator
        + 1   // used
        + 8   // redeemed_at
        + 8   // amount
        + 32  // user
        + 32; // payout_id_hash
}

/// Per-user per-day tracking PDA for daily cap enforcement.
/// Seeds: ["day", config_pda, user_wallet, day_id_u32_le_bytes]
#[account]
#[derive(Default)]
pub struct UserDay {
    /// UTC day number.
    pub day_id: u32,
    /// User wallet.
    pub user: Pubkey,
    /// Amount claimed today in base units.
    pub claimed: u64,
}

impl UserDay {
    pub const LEN: usize = 8  // discriminator
        + 4   // day_id
        + 32  // user
        + 8;  // claimed
}
