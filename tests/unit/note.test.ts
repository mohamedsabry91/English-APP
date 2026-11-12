import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Note } from '../../src/app/Note';

// The app is moving to English only: a note shows the English text when the content has it,
// otherwise the older Arabic text, and nothing when both are missing.
describe('Note', () => {
  it('shows the English text, left to right, before the Arabic', () => {
    const html = renderToStaticMarkup(createElement(Note, { en: 'Use "for" with a length of time.', ar: 'نستخدم for', className: 'explanation' }));
    expect(html).toBe('<p lang="en" dir="ltr" class="explanation">Use &quot;for&quot; with a length of time.</p>');
  });

  it('falls back to the Arabic text, right to left, when there is no English', () => {
    const html = renderToStaticMarkup(createElement(Note, { ar: 'نستخدم for' }));
    expect(html.startsWith('<p lang="ar" dir="rtl">')).toBe(true);
  });

  it('shows nothing when both are missing', () => {
    expect(renderToStaticMarkup(createElement(Note, {}))).toBe('');
  });
});
