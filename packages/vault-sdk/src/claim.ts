import { PublicKey } from '@solana/web3.js';
import { serialize, Schema } from 'borsh';

/**
 * ClaimV1 fields — the canonical claim structure.
 * Borsh serialization produces the exact message bytes that must be signed.
 */
export interface ClaimV1Fields {
  version: number;           // u8
  domain: Uint8Array;        // [u8; 16]
  programId: PublicKey;       // Pubkey
  config: PublicKey;          // Pubkey
  claimId: Uint8Array;        // [u8; 32]
  user: PublicKey;            // Pubkey
  usdcMint: PublicKey;        // Pubkey
  amount: bigint;             // u64
  validAfter: bigint;         // i64
  validBefore: bigint;        // i64
  dayId: number;              // u32
  dailyCap: bigint;           // u64
}

/**
 * ClaimV1 serialization class for Borsh.
 * Field order MUST match the Rust struct exactly.
 */
export class ClaimV1 {
  version: number;
  domain: Uint8Array;
  program_id: Uint8Array;
  config: Uint8Array;
  claim_id: Uint8Array;
  user: Uint8Array;
  usdc_mint: Uint8Array;
  amount: bigint;
  valid_after: bigint;
  valid_before: bigint;
  day_id: number;
  daily_cap: bigint;

  constructor(fields: ClaimV1Fields) {
    this.version = fields.version;
    this.domain = fields.domain;
    this.program_id = fields.programId.toBytes();
    this.config = fields.config.toBytes();
    this.claim_id = fields.claimId;
    this.user = fields.user.toBytes();
    this.usdc_mint = fields.usdcMint.toBytes();
    this.amount = fields.amount;
    this.valid_after = fields.validAfter;
    this.valid_before = fields.validBefore;
    this.day_id = fields.dayId;
    this.daily_cap = fields.dailyCap;
  }
}

/**
 * Borsh schema matching the Anchor ClaimV1Data struct.
 * Anchor uses standard Borsh: u8, fixed arrays, Pubkey as [u8;32], etc.
 */
const ClaimV1Schema: Schema = {
  struct: {
    version: 'u8',
    domain: { array: { type: 'u8', len: 16 } },
    program_id: { array: { type: 'u8', len: 32 } },
    config: { array: { type: 'u8', len: 32 } },
    claim_id: { array: { type: 'u8', len: 32 } },
    user: { array: { type: 'u8', len: 32 } },
    usdc_mint: { array: { type: 'u8', len: 32 } },
    amount: 'u64',
    valid_after: 'i64',
    valid_before: 'i64',
    day_id: 'u32',
    daily_cap: 'u64',
  },
};

/**
 * Serialize a ClaimV1 to the canonical message bytes.
 * Same inputs always produce the same bytes (deterministic).
 */
export function buildClaimMessage(fields: ClaimV1Fields): Uint8Array {
  const claim = new ClaimV1(fields);
  return new Uint8Array(serialize(ClaimV1Schema, claim));
}
