use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("Claim has already been redeemed")]
    ClaimAlreadyRedeemed,

    #[msg("Claim has expired (past valid_before)")]
    ClaimExpired,

    #[msg("Claim is not yet valid (before valid_after)")]
    ClaimNotYetValid,

    #[msg("Daily cap would be exceeded")]
    DailyCapExceeded,

    #[msg("Ed25519 verification instruction not found in transaction")]
    Ed25519InstructionMissing,

    #[msg("Ed25519 signer does not match config.propsim_signer")]
    Ed25519SignerMismatch,

    #[msg("Ed25519 message does not match reconstructed claim message")]
    Ed25519MessageMismatch,

    #[msg("Ed25519 signature mismatch")]
    Ed25519SignatureMismatch,

    #[msg("Invalid Ed25519 instruction data")]
    InvalidEd25519InstructionData,

    #[msg("Unauthorized: not the config authority")]
    Unauthorized,

    #[msg("Domain mismatch between claim and config")]
    DomainMismatch,

    #[msg("Program ID mismatch in claim")]
    ProgramIdMismatch,

    #[msg("Config PDA mismatch in claim")]
    ConfigMismatch,

    #[msg("USDC mint mismatch in claim")]
    MintMismatch,

    #[msg("User mismatch in claim")]
    UserMismatch,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}
