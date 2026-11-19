import crypto from "crypto";
import bcrypt from "bcrypt";

export function generateSecureOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';

  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }

  return otp;
}

export function hashOTP(otp) {
  return crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
}

export function generateAlphaNumericToken(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let otp = '';

  for (let i = 0; i < length; i++) {
    otp += chars[crypto.randomInt(0, chars.length)];
  }

  return otp;
}

export const hashedPassword = async (password) =>  await bcrypt.hash(password, 10);

export const comparePassword = async (password, hash) => await bcrypt.compare(password, hash);

export const generateRandom = () => crypto.randomInt(1000);