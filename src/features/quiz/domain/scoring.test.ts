import { describe, expect, it } from "vitest";
import { countHits, isAllOrNothingCorrect, scoreSession, PASSING_RATE } from "./scoring";

describe("isAllOrNothingCorrect", () => {
  it("集合が完全一致すれば正解（順序は問わない）", () => {
    expect(isAllOrNothingCorrect(["A", "C"], ["C", "A"])).toBe(true);
  });

  it("2つ中1つだけ一致は部分点なしで不正解", () => {
    expect(isAllOrNothingCorrect(["A", "C"], ["A", "B"])).toBe(false);
  });

  it("選択数が違えば不正解", () => {
    expect(isAllOrNothingCorrect(["A", "C"], ["A"])).toBe(false);
    expect(isAllOrNothingCorrect(["A", "C"], ["A", "C", "D"])).toBe(false);
  });

  it("同じ選択肢の重複では水増しできない", () => {
    expect(isAllOrNothingCorrect(["A", "C"], ["A", "A"])).toBe(false);
  });

  it("countHits は一致数を返す", () => {
    expect(countHits(["A", "C", "E"], ["A", "B", "E"])).toBe(2);
  });
});

describe("scoreSession", () => {
  const a = (slug: string, isCorrect: boolean) => ({ categorySlug: slug, categoryName: slug, isCorrect });

  it("合格ラインちょうどで合格", () => {
    const answers = [...Array(13)].map(() => a("x", true)).concat([...Array(7)].map(() => a("x", false)));
    const r = scoreSession(answers);
    expect(r.accuracy).toBe(PASSING_RATE);
    expect(r.passed).toBe(true);
  });

  it("合格ライン未満の分野を苦手分野として低い順に返す", () => {
    const r = scoreSession([a("p", false), a("p", false), a("q", true), a("q", false), a("r", true)]);
    expect(r.weakAreas.map((w) => w.slug)).toEqual(["p", "q"]);
    expect(r.recommendations).toHaveLength(2);
  });
});
