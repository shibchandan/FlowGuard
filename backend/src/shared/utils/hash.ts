// src/shared/utils/hash.ts
// Hashing utilities for payloads and passwords.

import crypto from 'crypto';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 10;

/**
 * Creates a deterministic SHA-256 hash of an arbitrary value.
 * Object keys are sorted before serialising to ensure consistency.
 */
export function hashPayload(data: unknown): string {
  const normalised = sortKeys(data);
  const json = JSON.stringify(normalised);
  return crypto.createHash('sha256').update(json).digest('hex');
}

/**
 * Recursively sorts object keys so that hash is deterministic.
 */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Hashes a plain-text password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compares a plain-text password against a bcrypt hash.
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
