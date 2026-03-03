import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

export interface VaultPdas {
  configPda: PublicKey;
  configBump: number;
  vaultAuthority: PublicKey;
  vaultAuthorityBump: number;
  vaultUsdc: PublicKey;
  claimMarker: PublicKey;
  claimMarkerBump: number;
  userDay: PublicKey;
  userDayBump: number;
}

/**
 * Derive all PDAs needed for vault operations.
 */
export function derivePdas(
  programId: PublicKey,
  configAuthority: PublicKey,
  usdcMint: PublicKey,
  claimId: Uint8Array,
  user: PublicKey,
  dayId: number,
): VaultPdas {
  // Config PDA: ["config", authority]
  const [configPda, configBump] = PublicKey.findProgramAddressSync(
    [Buffer.from('config'), configAuthority.toBuffer()],
    programId,
  );

  // Vault Authority PDA: ["vault", config]
  const [vaultAuthority, vaultAuthorityBump] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), configPda.toBuffer()],
    programId,
  );

  // Vault USDC = ATA(vaultAuthority, usdcMint)
  const vaultUsdc = getAssociatedTokenAddressSync(usdcMint, vaultAuthority, true);

  // ClaimMarker PDA: ["claim", config, claim_id]
  const [claimMarker, claimMarkerBump] = PublicKey.findProgramAddressSync(
    [Buffer.from('claim'), configPda.toBuffer(), Buffer.from(claimId)],
    programId,
  );

  // UserDay PDA: ["day", config, user, day_id_le]
  const dayBuf = Buffer.alloc(4);
  dayBuf.writeUInt32LE(dayId, 0);
  const [userDay, userDayBump] = PublicKey.findProgramAddressSync(
    [Buffer.from('day'), configPda.toBuffer(), user.toBuffer(), dayBuf],
    programId,
  );

  return {
    configPda,
    configBump,
    vaultAuthority,
    vaultAuthorityBump,
    vaultUsdc,
    claimMarker,
    claimMarkerBump,
    userDay,
    userDayBump,
  };
}
