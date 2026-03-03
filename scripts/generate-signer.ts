/**
 * generate-signer.ts — Generate an Ed25519 keypair for claim signing.
 * Outputs the base64-encoded secret key for PROPSIM_CLAIM_SIGNER_ED25519_PRIVATE_KEY_BASE64
 * and the corresponding public key.
 */
import * as nacl from 'tweetnacl';

const keypair = nacl.sign.keyPair();
const secretB64 = Buffer.from(keypair.secretKey).toString('base64');
const pubB64 = Buffer.from(keypair.publicKey).toString('base64');
const { PublicKey } = require('@solana/web3.js');
const pubSolana = new PublicKey(keypair.publicKey).toBase58();

console.log('=== Ed25519 Claim Signer Keypair ===');
console.log('');
console.log('PROPSIM_CLAIM_SIGNER_ED25519_PRIVATE_KEY_BASE64=' + secretB64);
console.log('');
console.log('Public key (base64):', pubB64);
console.log('Public key (base58/Solana):', pubSolana);
console.log('');
console.log('Use the Solana pubkey as the propsim_signer when initializing vault config.');
