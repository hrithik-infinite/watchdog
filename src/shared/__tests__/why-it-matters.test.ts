import { describe, expect, it } from 'vitest';
import { MVP_RULES } from '../constants';
import { WHY_IT_MATTERS, whyItMatters } from '../why-it-matters';

describe('why-it-matters - WHY_IT_MATTERS map', () => {
  const entries = Object.entries(WHY_IT_MATTERS);

  describe('map shape', () => {
    it('is a non-empty record', () => {
      expect(typeof WHY_IT_MATTERS).toBe('object');
      expect(WHY_IT_MATTERS).not.toBeNull();
      expect(Array.isArray(WHY_IT_MATTERS)).toBe(false);
      expect(entries.length).toBeGreaterThan(0);
    });

    it('has every value as a non-empty, trimmed string', () => {
      for (const [key, value] of entries) {
        expect(typeof value, `value for "${key}"`).toBe('string');
        expect(value.length, `value for "${key}" is empty`).toBeGreaterThan(0);
        expect(value, `value for "${key}" has untrimmed whitespace`).toBe(value.trim());
      }
    });

    it('has every key as a non-empty, trimmed string', () => {
      for (const [key] of entries) {
        expect(typeof key).toBe('string');
        expect(key.length).toBeGreaterThan(0);
        expect(key).toBe(key.trim());
      }
    });

    it('has no duplicate keys', () => {
      const keys = Object.keys(WHY_IT_MATTERS);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('has no duplicate values', () => {
      const values = entries.map(([, value]) => value);
      const seen = new Map<string, string>();
      for (const [key, value] of entries) {
        const existing = seen.get(value);
        expect(existing, `"${key}" duplicates the message already used by "${existing}"`).toBe(
          undefined
        );
        seen.set(value, key);
      }
      expect(new Set(values).size).toBe(values.length);
    });
  });

  describe('coverage of MVP_RULES', () => {
    it.each(MVP_RULES)('has a why-it-matters line for MVP rule "%s"', (ruleId) => {
      expect(WHY_IT_MATTERS[ruleId]).toBeTruthy();
      expect(typeof WHY_IT_MATTERS[ruleId]).toBe('string');
    });

    it('covers every MVP rule with no gaps', () => {
      const missing = MVP_RULES.filter((ruleId) => !(ruleId in WHY_IT_MATTERS));
      expect(missing).toEqual([]);
    });
  });

  describe('content quality', () => {
    it('keeps each line plain-language length (a single sentence, not a paragraph)', () => {
      for (const [key, value] of entries) {
        // Sanity bound: a one-sentence consequence, never an essay.
        expect(value.length, `"${key}" is unexpectedly long`).toBeLessThan(220);
      }
    });

    it('ends each line with sentence punctuation', () => {
      for (const [key, value] of entries) {
        expect(/[.!?]["']?$/.test(value), `"${key}" missing terminal punctuation: ${value}`).toBe(
          true
        );
      }
    });

    it('includes entries from each scanner category beyond accessibility', () => {
      // Spot-check a representative ruleId from each custom scanner family.
      expect(WHY_IT_MATTERS['performance-cls']).toBeTruthy();
      expect(WHY_IT_MATTERS['title-missing']).toBeTruthy();
      expect(WHY_IT_MATTERS['https-not-enabled']).toBeTruthy();
      expect(WHY_IT_MATTERS['broken-images']).toBeTruthy();
      expect(WHY_IT_MATTERS['manifest-missing']).toBeTruthy();
    });

    it('has more entries than just the MVP accessibility rules', () => {
      expect(entries.length).toBeGreaterThan(MVP_RULES.length);
    });
  });
});

describe('why-it-matters - whyItMatters()', () => {
  it('returns the mapped string for a known ruleId', () => {
    expect(whyItMatters('image-alt')).toBe(WHY_IT_MATTERS['image-alt']);
  });

  it('returns the mapped string for every key in the map', () => {
    for (const [key, value] of Object.entries(WHY_IT_MATTERS)) {
      expect(whyItMatters(key)).toBe(value);
    }
  });

  it('returns the mapped string for every MVP rule', () => {
    for (const ruleId of MVP_RULES) {
      expect(whyItMatters(ruleId)).toBe(WHY_IT_MATTERS[ruleId]);
    }
  });

  it('returns undefined for an unknown ruleId', () => {
    expect(whyItMatters('not-a-real-rule')).toBeUndefined();
  });

  it('returns undefined for an empty ruleId', () => {
    expect(whyItMatters('')).toBeUndefined();
  });
});
