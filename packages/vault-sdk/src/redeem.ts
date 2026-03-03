import {
  PublicKey,
  TransactionInstruction,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SystemProgram,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { ClaimV1Fields, buildClaimMessage } from './claim';
import { derivePdas } from './pdas';

/**
 * Build the `redeem_claim` instruction for the propsim_vault program.
 */
export function makeRedeemIx(params: {
  programId: PublicKey;
  configAuthority: PublicKey;
  usdcMint: PublicKey;
  user: PublicKey;
  claimFields: ClaimV1Fields;
  signature: Uint8Array; // 64 bytes
}): TransactionInstruction {
  const { programId, configAuthority, usdcMint, user, claimFields, signature } = params;

  const pdas = derivePdas(
    programId,
    configAuthority,
    usdcMint,
    claimFields.claimId,
    user,
    claimFields.dayId,
  );

  const userUsdc = getAssociatedTokenAddressSync(usdcMint, user, false);

  // Build the instruction data: discriminator + borsh(ClaimV1Data) + [u8;64] sig
  // Anchor discriminator = first 8 bytes of sha256("global:redeem_claim")
  const discriminator = anchorDiscriminator('redeem_claim');

  const claimBytes = buildClaimMessage(claimFields);
  // Anchor serializes claim_data with a 4-byte length prefix for the struct? No —
  // since ClaimV1Data is a fixed struct (not a Vec), Anchor Borsh just serializes fields directly.
  // The signature is [u8; 64], also serialized directly.

  const data = Buffer.concat([
    discriminator,
    Buffer.from(claimBytes),
    Buffer.from(signature),
  ]);

  const keys = [
    { pubkey: pdas.configPda, isSigner: false, isWritable: false },
    { pubkey: pdas.vaultAuthority, isSigner: false, isWritable: false },
    { pubkey: pdas.vaultUsdc, isSigner: false, isWritable: true },
    { pubkey: user, isSigner: true, isWritable: true },
    { pubkey: userUsdc, isSigner: false, isWritable: true },
    { pubkey: usdcMint, isSigner: false, isWritable: false },
    { pubkey: pdas.claimMarker, isSigner: false, isWritable: true },
    { pubkey: pdas.userDay, isSigner: false, isWritable: true },
    { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
}

/**
 * Compute an Anchor instruction discriminator.
 */
function anchorDiscriminator(name: string): Buffer {
  // Uses the same method as Anchor: sha256("global:<name>")[0..8]
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(`global:${name}`).digest();
  return hash.slice(0, 8);
}
