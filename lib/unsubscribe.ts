import crypto from 'crypto';

export function createSignature(email: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(email).digest('hex');
}

export function verifySignature(email: string, signature: string, secret: string) {
  const expected = createSignature(email, secret);
  if (expected.length !== signature.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}
