import { describe, expect, it } from 'vitest';
import { splitLatin } from '../../src/app/ArText';

describe('splitLatin', () => {
  it('keeps the final period with the Arabic text', () => {
    expect(splitLatin('نقول discuss the plan.')).toEqual([
      { latin: false, text: 'نقول ' },
      { latin: true, text: 'discuss the plan' },
      { latin: false, text: '.' },
    ]);
  });
  it('keeps question marks and ellipses with the English', () => {
    expect(splitLatin('مثل Could you please...؟').map((p) => p.text)).toEqual(['مثل ', 'Could you please...', '؟']);
    expect(splitLatin('السؤال: Is he...?').map((p) => p.text)).toEqual(['السؤال: ', 'Is he...?']);
  });
  it('returns plain Arabic unchanged', () => {
    expect(splitLatin('نص عربي فقط.')).toEqual([{ latin: false, text: 'نص عربي فقط.' }]);
  });
});

describe('splitLatin with brackets', () => {
  it('keeps an English example in brackets together', () => {
    expect(splitLatin('تحية (Dear Mr. Hassan,)، ثم').map((p) => p.text)).toEqual(['تحية ', '(Dear Mr. Hassan,)', '، ثم']);
  });
});
