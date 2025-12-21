import { randomBytes } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/I/1

export function generateAffiliateCode(length = 8): string {
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    const idx = (bytes[i] ?? 0) % ALPHABET.length;
    code += ALPHABET[idx];
  }
  return code;
}
