import { describe, it, expect } from "vitest";
import {
  computePriority,
  selectByPriority,
  PriorityBucket,
  type QuestionState,
} from "./priority";

const NOW = new Date("2026-06-06T12:00:00");

function daysAgo(n: number, hour = 9): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

describe("computePriority", () => {
  it("未回答は UNANSWERED バケット", () => {
    const s: QuestionState = {
      questionId: "q1",
      lastResult: null,
      lastAnsweredAt: null,
    };
    expect(computePriority(s, NOW).bucket).toBe(PriorityBucket.UNANSWERED);
  });

  it("直近正解は CORRECT バケット", () => {
    const s: QuestionState = {
      questionId: "q2",
      lastResult: true,
      lastAnsweredAt: daysAgo(0),
    };
    expect(computePriority(s, NOW).bucket).toBe(PriorityBucket.CORRECT);
  });

  it("今日間違えたら WRONG_TODAY", () => {
    const s: QuestionState = {
      questionId: "q3",
      lastResult: false,
      lastAnsweredAt: daysAgo(0),
    };
    expect(computePriority(s, NOW).bucket).toBe(PriorityBucket.WRONG_TODAY);
  });

  it("3日前に間違えたら WRONG_3D", () => {
    const s: QuestionState = {
      questionId: "q4",
      lastResult: false,
      lastAnsweredAt: daysAgo(2),
    };
    expect(computePriority(s, NOW).bucket).toBe(PriorityBucket.WRONG_3D);
  });

  it("6日前に間違えたら WRONG_7D", () => {
    const s: QuestionState = {
      questionId: "q5",
      lastResult: false,
      lastAnsweredAt: daysAgo(6),
    };
    expect(computePriority(s, NOW).bucket).toBe(PriorityBucket.WRONG_7D);
  });

  it("8日以上前に間違えたら WRONG_STALE", () => {
    const s: QuestionState = {
      questionId: "q6",
      lastResult: false,
      lastAnsweredAt: daysAgo(10),
    };
    expect(computePriority(s, NOW).bucket).toBe(PriorityBucket.WRONG_STALE);
  });

  it("優先度スコアはバケット順に単調（今日誤答 > 3日 > 7日 > 放置 > 未回答 > 正解）", () => {
    const score = (s: QuestionState) => computePriority(s, NOW).score;
    const wrongToday = score({
      questionId: "a",
      lastResult: false,
      lastAnsweredAt: daysAgo(0),
    });
    const wrong3d = score({
      questionId: "b",
      lastResult: false,
      lastAnsweredAt: daysAgo(2),
    });
    const wrong7d = score({
      questionId: "c",
      lastResult: false,
      lastAnsweredAt: daysAgo(6),
    });
    const unanswered = score({
      questionId: "d",
      lastResult: null,
      lastAnsweredAt: null,
    });
    const correct = score({
      questionId: "e",
      lastResult: true,
      lastAnsweredAt: daysAgo(0),
    });
    expect(wrongToday).toBeGreaterThan(wrong3d);
    expect(wrong3d).toBeGreaterThan(wrong7d);
    expect(wrong7d).toBeGreaterThan(unanswered);
    expect(unanswered).toBeGreaterThan(correct);
  });
});

describe("selectByPriority", () => {
  it("優先度の高い問題から count 件選ぶ", () => {
    const states: QuestionState[] = [
      { questionId: "correct", lastResult: true, lastAnsweredAt: daysAgo(0) },
      { questionId: "wrongToday", lastResult: false, lastAnsweredAt: daysAgo(0) },
      { questionId: "unanswered", lastResult: null, lastAnsweredAt: null },
    ];
    // rng 固定でタイブレークを決定的に
    const result = selectByPriority(states, 2, NOW, () => 0.5);
    expect(result[0]).toBe("wrongToday");
    expect(result[1]).toBe("unanswered");
    expect(result).toHaveLength(2);
  });

  it("count が件数を超えても全件返す", () => {
    const states: QuestionState[] = [
      { questionId: "a", lastResult: null, lastAnsweredAt: null },
    ];
    expect(selectByPriority(states, 10, NOW, () => 0)).toHaveLength(1);
  });
});
