/**
 * Trusted ERC-20 contracts on Arc Testnet, keyed by lowercase address.
 * Balances and activity are filtered to these so spam/airdrop tokens (and
 * symbol-clone scams, e.g. a fake "USDC") never appear as if they were real.
 * Addresses are the official Arc Testnet contracts (docs.arc.io / Tower).
 */
export const TRUSTED_ARC_TOKENS: Record<string, string> = {
  "0x3600000000000000000000000000000000000000": "USDC",
  "0x89b50855aa3be2f677cd6303cec089b5f319d72a": "EURC",
  "0x175cdb1d338945f0d851a741ccf787d343e57952": "USDT",
  "0xf0c4a4ce82a5746abaad9425360ab04fbba432bf": "cirBTC",
  "0xe9185f0c5f296ed1797aae4238d26ccabeadb86c": "USYC",
  "0xcd304d2a421bfed31d45f0054af8e8a6a4cf3eae": "QTM",
  "0xbe7477bf91526fc9988c8f33e91b6db687119d45": "SWPRC",
  "0xc5124c846c6e6307986988dfb7e743327aa05f19": "SYN",
  "0x9a9c18a371d98200fe910f62c45875f1abb68d20": "cNGN",
  "0x23d7cffd0876f3abb6b074287ba2aeefbc83825d": "QCAD",
};

export function isTrustedArcToken(address: string): boolean {
  return TRUSTED_ARC_TOKENS[address.toLowerCase()] !== undefined;
}
