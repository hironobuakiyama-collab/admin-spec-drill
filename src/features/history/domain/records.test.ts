import { describe, expect, it } from "vitest";
import { buildQuestionStates, currentMistakes, type AnswerRecord } from "./records";

const rec = (questionId: string, isCorrect: boolean, answeredAt: string): AnswerRecord => ({
  questionId,
  isCorrect,
  answeredAt,
  selected: ["A"],
  sessionId: "s",
  elapsedMs: 1000,
});

describe("records", () => {
  const answers = [
    rec("q1", false, "2026-10-01T10:00:00.000Z"),
    rec("q1", true, "2026-10-02T10:00:00.000Z"),
    rec("q2", false, "2026-10-03T10:00:00.000Z"),
    rec("q3", false, "2026-10-04T10:00:00.000Z"),
  ];

  it("最新回答で状態を作り、未回答は null", () => {
    const states = buildQuestionStates(["q1", "q4"], answers);
    expect(states[0].lastResult).toBe(true);
    expect(states[1]).toEqual({ questionId: "q4", lastResult: null, lastAnsweredAt: null });
  });

  it("直近が不正解の問題だけを新しい順に返す（後で正解した問題は除く）", () => {
    expect(currentMistakes(answers)).toEqual(["q3", "q2"]);
  });
});
