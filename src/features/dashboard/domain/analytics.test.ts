import { describe, expect, it } from "vitest";
import { answerPace, categoryProgress, dailyTrend, firstTryStats, repeatStats, type AnalyticsRecord } from "./analytics";

const r = (questionId: string, isCorrect: boolean, day: number, elapsedSec = 60): AnalyticsRecord => ({
  questionId,
  isCorrect,
  answeredAt: new Date(2026, 9, day, 12),
  elapsedMs: elapsedSec * 1000,
  categorySlug: questionId.split("-")[0],
  difficulty: "INTERMEDIATE",
});

describe("analytics", () => {
  const answers = [r("a-1", false, 1), r("a-1", true, 2), r("b-1", true, 2, 200), r("a-2", true, 3, 2000)];

  it("初見正答率は各問1回目だけを見る", () => {
    expect(firstTryStats(answers)).toEqual({ total: 3, correct: 2, accuracy: 67 });
    expect(repeatStats(answers)).toEqual({ total: 1, correct: 1, accuracy: 100 });
  });

  it("分野ごとの消化数と今解ける問題数", () => {
    const pool = [
      { id: "a-1", category: "a" },
      { id: "a-2", category: "a" },
      { id: "a-3", category: "a" },
      { id: "b-1", category: "b" },
    ];
    const a = categoryProgress(answers, pool).find((c) => c.slug === "a")!;
    expect(a).toMatchObject({ poolSize: 3, covered: 2, masteredNow: 2 });
    expect(a.firstTry.accuracy).toBe(50);
  });

  it("日別推移は学習していない日も 0 件で含める", () => {
    const t = dailyTrend(answers, 5, new Date(2026, 9, 3, 20));
    expect(t).toHaveLength(5);
    expect(t.map((p) => p.total)).toEqual([0, 0, 1, 2, 1]);
  });

  it("解答時間は中断（600秒以上）を除き、本番の持ち時間以内の割合を出す", () => {
    const p = answerPace(answers);
    expect(p.samples).toBe(3);
    expect(p.medianSec).toBe(60);
    expect(p.withinExamRate).toBe(67);
  });
});
