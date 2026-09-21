import { describe, expect, it } from 'vitest';

describe('infrastructure test harness', () => {
  it('runs in the configured jsdom environment', () => {
    expect(typeof document.createElement).toBe('function');
  });
});
