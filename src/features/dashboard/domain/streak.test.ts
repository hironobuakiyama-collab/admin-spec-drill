import { describe, it, expect } from "vitest";
import { computeStreak } from "./streak";

const NOW = new Date("2026-06-06T12:00:00");

function day(offset: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() + offset);
  d.setHours(10, 0, 0, 0);
  return d;
}

describe("computeStreak", () => {
  it("学習履歴なしは 0", () => {
    expect(computeStreak([], NOW)).toBe(0);
  });

  it("今日だけ学習なら 1", () => {
    expect(computeStreak([day(0)], NOW)).toBe(1);
  });

  it("今日から3日連続なら 3", () => {
    expect(computeStreak([day(0), day(-1), day(-2)], NOW)).toBe(3);
  });

  it("同じ日に複数回でも1日として数える", () => {
    expect(computeStreak([day(0), day(0), day(-1)], NOW)).toBe(2);
  });

  it("今日未学習でも昨日まで連続していれば維持", () => {
    expect(computeStreak([day(-1), day(-2)], NOW)).toBe(2);
  });

  it("2日以上空いていれば 0", () => {
    expect(computeStreak([day(-2), day(-3)], NOW)).toBe(0);
  });

  it("途中で途切れたら連続分のみ数える", () => {
    expect(computeStreak([day(0), day(-1), day(-3), day(-4)], NOW)).toBe(2);
  });
});
