import { describe, expect, it } from 'vitest';
import holdout from '../fixtures/writing-checker-holdout.json';
import { check } from '../../src/checker';

// Report only: these sentences were written after the rules, to estimate real precision and recall.
describe('checker held-out set (report only)', () => {
  it('reports catch rate and false positives', () => {
    const items = (holdout as { items: { text: string; expect: string | null }[] }).items;
    const mistakes = items.filter((i) => i.expect);
    const correct = items.filter((i) => !i.expect);
    const caught = mistakes.filter((m) => check(m.text).some((f) => f.tag === m.expect));
    const fp = correct.filter((c) => check(c.text).length > 0);
    console.log(`HOLDOUT caught ${caught.length}/${mistakes.length}; false positives ${fp.length}/${correct.length}`);
    for (const m of mistakes.filter((x) => !caught.includes(x))) console.log(`HOLDOUT missed ${m.expect}: ${m.text}`);
    for (const c of fp) console.log(`HOLDOUT false positive: ${c.text} -> ${check(c.text).map((f) => f.tag).join(',')}`);
    expect(items.length).toBeGreaterThan(0);
  });
});
