// src/tests/unit/idempotency.test.ts
import { describe, it, expect } from 'vitest';
import { hashPayload } from '../../shared/utils/hash';

describe('Idempotency - Payload Hashing', () => {
  it('generates identical hash for payloads with different key orders', () => {
    const payloadA = {
      applicantName: 'Rahul Sharma',
      creditScore: 750,
      email: 'rahul@example.com',
      age: 28,
    };

    const payloadB = {
      age: 28,
      email: 'rahul@example.com',
      applicantName: 'Rahul Sharma',
      creditScore: 750,
    };

    const hashA = hashPayload(payloadA);
    const hashB = hashPayload(payloadB);

    expect(hashA).toBe(hashB);
    expect(hashA).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generates distinct hashes for different payloads', () => {
    const payload1 = { creditScore: 750 };
    const payload2 = { creditScore: 751 };

    expect(hashPayload(payload1)).not.toBe(hashPayload(payload2));
  });

  it('handles nested objects and arrays deterministically', () => {
    const nestedA = {
      user: { name: 'Alice', details: { score: 100 } },
      tags: ['a', 'b'],
    };

    const nestedB = {
      tags: ['a', 'b'],
      user: { details: { score: 100 }, name: 'Alice' },
    };

    expect(hashPayload(nestedA)).toBe(hashPayload(nestedB));
  });
});
