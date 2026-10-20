import { describe, expect, it } from "vitest";
import { apportion, selectMock, selectWeakness, shuffle } from "./selection";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

describe("apportion", () => {
  it("配点に比例して按分し、合計は total", () => {
    const r = apportion(20, { a: 15, b: 15, c: 10, d: 10, e: 10, f: 17, g: 15, h: 8 }, { a: 99, b: 99, c: 99, d: 99, e: 99, f: 99, g: 99, h: 99 });
    expect(Object.values(r).reduce((s, n) => s + n, 0)).toBe(20);
    expect(r.f).toBeGreaterThanOrEqual(r.h);
    expect(r.h).toBeGreaterThanOrEqual(1);
  });

  it("上限に達した分野の残りは他分野へ回す", () => {
    const r = apportion(10, { a: 90, b: 10 }, { a: 3, b: 20 });
    expect(r).toEqual({ a: 3, b: 7 });
  });

  it("プール全体より多く求めてもプール数で止まる", () => {
    const r = apportion(100, { a: 1, b: 1 }, { a: 2, b: 3 });
    expect(r).toEqual({ a: 2, b: 3 });
  });
});

describe("selectMock", () => {
  const pool = [
    ...[...Array(10)].map((_, i) => ({ id: `big-${i}`, category: "big" })),
    ...[...Array(10)].map((_, i) => ({ id: `small-${i}`, category: "small" })),
  ];

  it("重複なく count 件を配点比で選ぶ", () => {
    const ids = selectMock(pool, { big: 3, small: 1 }, 8, seeded(1));
    expect(new Set(ids).size).toBe(8);
    expect(ids.filter((id) => id.startsWith("big")).length).toBe(6);
  });
});

describe("selectWeakness", () => {
  it("正答率の低い分野から出題する", () => {
    const pool = [
      { id: "a1", category: "a" },
      { id: "a2", category: "a" },
      { id: "b1", category: "b" },
      { id: "b2", category: "b" },
    ];
    const states = pool.map((q) => ({ questionId: q.id, lastResult: null, lastAnsweredAt: null }));
    const ids = selectWeakness(pool, states, { a: 90, b: 20 }, 2, new Date(), seeded(2));
    expect(ids.every((id) => id.startsWith("b"))).toBe(true);
  });
});

describe("shuffle", () => {
  it("要素を失わない", () => {
    expect(shuffle([1, 2, 3, 4, 5], seeded(3)).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
