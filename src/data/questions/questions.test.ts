import { describe, expect, it } from "vitest";
import { QUESTIONS } from "./index";
import { CATEGORY_SLUGS } from "@/config/categories";

describe("問題データの整合性", () => {
  it("ID が一意で、分野プレフィックスと一致する", () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of QUESTIONS) {
      expect(q.id).toMatch(new RegExp(`^${q.category}-\\d{2}$`));
      expect(CATEGORY_SLUGS).toContain(q.category);
    }
  });

  it.each(QUESTIONS.map((q) => [q.id, q] as const))("%s の構造が正しい", (_id, q) => {
    const keys = q.options.map((o) => o.key);
    expect(keys).toEqual("ABCDEFG".slice(0, keys.length).split(""));
    expect(keys.length).toBeGreaterThanOrEqual(4);
    expect(q.pick).toBeGreaterThanOrEqual(1);
    expect(q.answer.length).toBe(q.pick);
    expect(new Set(q.answer).size).toBe(q.answer.length);
    for (const a of q.answer) expect(keys).toContain(a);
    if (q.pick > 1) expect(keys.length).toBeGreaterThan(q.pick + 1);
    expect(Object.keys(q.explanation.perOption).sort()).toEqual(keys);
    expect(q.explanation.analogy.length).toBeGreaterThanOrEqual(2);
    expect(q.explanation.background.length).toBeGreaterThanOrEqual(1);
    expect(q.stem.length).toBeGreaterThan(20);
    expect(q.explanation.tip.length).toBeGreaterThan(10);
  });

  it("全分野に問題がある", () => {
    for (const slug of CATEGORY_SLUGS) {
      expect(QUESTIONS.some((q) => q.category === slug)).toBe(true);
    }
  });
});
