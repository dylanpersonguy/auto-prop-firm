use anchor_lang::prelude::*;
use anchor_lang::solana_program::ed25519_program;
use anchor_lang::solana_program::sysvar::instructions as sysvar_instructions;

use crate::errors::VaultError;

/// Offsets within the Ed25519 instruction data for a single signature.
/// Reference: solana_sdk::ed25519_instruction
const ED25519_PUBKEY_OFFSET: usize = 16;
const ED25519_SIG_OFFSET: usize = 48;
const ED25519_MSG_OFFSET_FIELD: usize = 112;
const ED25519_MSG_SIZE_FIELD: usize = 114;
const ED25519_MSG_DATA_OFFSET: usize = 116;

/// Verify that the transaction contains an Ed25519 program instruction
/// that verifies the expected signer, message, and signature.
pub fn verify_ed25519_ix(
    instructions_sysvar: &AccountInfo,
    expected_signer: &[u8; 32],
    expected_message: &[u8],
    expected_signature: &[u8; 64],
) -> Result<()> {
    // Load the instruction at index 0 (ed25519 verify must be first ix)
    let ix = sysvar_instructions::load_instruction_at_checked(0, instructions_sysvar)
        .map_err(|_| VaultError::Ed25519InstructionMissing)?;

    // Verify it's the ed25519 program
    require!(
        ix.program_id == ed25519_program::ID,
        VaultError::Ed25519InstructionMissing
    );

    let ix_data = &ix.data;

    // First 2 bytes: num signatures (u16 LE), must be at least 1
    require!(ix_data.len() >= ED25519_MSG_DATA_OFFSET, VaultError::InvalidEd25519InstructionData);

    let num_signatures = u16::from_le_bytes([ix_data[0], ix_data[1]]) as usize;
    require!(num_signatures >= 1, VaultError::InvalidEd25519InstructionData);

    // Extract pubkey (32 bytes starting at offset 16)
    let pubkey_start = ED25519_PUBKEY_OFFSET;
    let pubkey_end = pubkey_start + 32;
    require!(ix_data.len() >= pubkey_end, VaultError::InvalidEd25519InstructionData);
    let pubkey = &ix_data[pubkey_start..pubkey_end];

    require!(
        pubkey == expected_signer.as_ref(),
        VaultError::Ed25519SignerMismatch
    );

    // Extract signature (64 bytes starting at offset 48)
    let sig_start = ED25519_SIG_OFFSET;
    let sig_end = sig_start + 64;
    require!(ix_data.len() >= sig_end, VaultError::InvalidEd25519InstructionData);
    let sig = &ix_data[sig_start..sig_end];

    require!(
        sig == expected_signature.as_ref(),
        VaultError::Ed25519SignatureMismatch
    );

    // Extract message offset and size
    let msg_data_offset = u16::from_le_bytes([
        ix_data[ED25519_MSG_OFFSET_FIELD],
        ix_data[ED25519_MSG_OFFSET_FIELD + 1],
    ]) as usize;
    let msg_data_size = u16::from_le_bytes([
        ix_data[ED25519_MSG_SIZE_FIELD],
        ix_data[ED25519_MSG_SIZE_FIELD + 1],
    ]) as usize;

    let msg_end = msg_data_offset + msg_data_size;
    require!(ix_data.len() >= msg_end, VaultError::InvalidEd25519InstructionData);

    let msg = &ix_data[msg_data_offset..msg_end];

    require!(
        msg == expected_message,
        VaultError::Ed25519MessageMismatch
    );

    Ok(())
}
