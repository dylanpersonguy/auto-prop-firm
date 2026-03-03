import { PublicKey, TransactionInstruction } from '@solana/web3.js';

/**
 * Ed25519 native program ID.
 */
const ED25519_PROGRAM_ID = new PublicKey('Ed25519SigVerify111111111111111111111111111');

/**
 * Build an Ed25519 signature verification instruction.
 *
 * This instruction must be placed BEFORE the redeem_claim instruction
 * in the same transaction. The vault program introspects the instructions
 * sysvar to confirm verification.
 *
 * Layout (for 1 signature):
 * - [0..2]   num_signatures (u16 LE) = 1
 * - [2..4]   padding = 0
 * - [4..6]   signature_offset (u16 LE)
 * - [6..8]   signature_ix_index (u16 LE) = 0xFFFF (same tx)
 * - [8..10]  pubkey_offset (u16 LE)
 * - [10..12] pubkey_ix_index (u16 LE) = 0xFFFF
 * - [12..14] message_data_offset (u16 LE)
 * - [14..16] message_data_size (u16 LE)
 * - [16..48] pubkey (32 bytes)
 * - [48..112] signature (64 bytes)
 * - [112..N] message (variable)
 */
export function makeEd25519VerifyIx(
  pubkey: Uint8Array,  // 32 bytes
  message: Uint8Array,
  signature: Uint8Array, // 64 bytes
): TransactionInstruction {
  if (pubkey.length !== 32) throw new Error('pubkey must be 32 bytes');
  if (signature.length !== 64) throw new Error('signature must be 64 bytes');

  const numSignatures = 1;

  // Offsets within the ix data
  const pubkeyOffset = 16;
  const signatureOffset = 48;
  const messageOffset = 112;
  const messageSize = message.length;

  const dataLen = messageOffset + messageSize;
  const data = Buffer.alloc(dataLen);

  // num_signatures
  data.writeUInt16LE(numSignatures, 0);
  // padding
  data.writeUInt16LE(0, 2);

  // -- Signature offsets struct (for one sig) --
  // signature_offset
  data.writeUInt16LE(signatureOffset, 4);
  // signature_instruction_index (0xFFFF = same tx data)
  data.writeUInt16LE(0xffff, 6);
  // pubkey_offset
  data.writeUInt16LE(pubkeyOffset, 8);
  // pubkey_instruction_index
  data.writeUInt16LE(0xffff, 10);
  // message_data_offset
  data.writeUInt16LE(messageOffset, 12);
  // message_data_size
  data.writeUInt16LE(messageSize, 14);

  // pubkey
  Buffer.from(pubkey).copy(data, pubkeyOffset);
  // signature
  Buffer.from(signature).copy(data, signatureOffset);
  // message
  Buffer.from(message).copy(data, messageOffset);

  return new TransactionInstruction({
    keys: [],
    programId: ED25519_PROGRAM_ID,
    data,
  });
}
