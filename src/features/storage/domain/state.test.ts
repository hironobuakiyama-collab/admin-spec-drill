import { describe, expect, it } from "vitest";
import { activeSession, EMPTY_STATE, mergeStates, parseState } from "./state";

const answer = { questionId: "q1", selected: ["A"], isCorrect: true, answeredAt: "2026-10-01T00:00:00.000Z", sessionId: "s1", elapsedMs: 10 };
const session = {
  id: "s1",
  mode: "DAILY",
  title: "今日の10問",
  questionIds: ["q1", "q2"],
  startedAt: "2026-10-01T00:00:00.000Z",
  currentIndex: 5,
  responses: {},
  flagged: [],
};

describe("parseState", () => {
  it("壊れた値は空の状態にする", () => {
    expect(parseState("oops")).toEqual(EMPTY_STATE);
    expect(parseState(null)).toEqual(EMPTY_STATE);
  });

  it("不正なレコードだけを捨てる", () => {
    const s = parseState({ answers: [answer, { questionId: 1 }], sessions: [session, { id: "x" }], bookmarks: ["q1", "q1"] });
    expect(s.answers).toHaveLength(1);
    expect(s.sessions).toHaveLength(1);
    expect(s.bookmarks).toEqual(["q1"]);
  });

  it("範囲外の currentIndex を丸め、消えた問題への参照を除く", () => {
    const s = parseState({ answers: [answer], sessions: [session], bookmarks: ["gone"] }, new Set(["q2"]));
    expect(s.answers).toHaveLength(0);
    expect(s.sessions[0].questionIds).toEqual(["q2"]);
    expect(s.sessions[0].currentIndex).toBe(0);
    expect(s.bookmarks).toEqual([]);
  });
});

describe("mergeStates / activeSession", () => {
  it("同じ回答を重複させずに取り込む", () => {
    const base = parseState({ answers: [answer], sessions: [session], bookmarks: [] });
    const merged = mergeStates(base, parseState({ answers: [answer, { ...answer, answeredAt: "2026-10-02T00:00:00.000Z" }], sessions: [session], bookmarks: ["q2"] }));
    expect(merged.answers).toHaveLength(2);
    expect(merged.sessions).toHaveLength(1);
    expect(merged.bookmarks).toEqual(["q2"]);
  });

  it("未終了の最新セッションを返す", () => {
    const s = parseState({ sessions: [session, { ...session, id: "s2", startedAt: "2026-10-02T00:00:00.000Z", finishedAt: "2026-10-02T01:00:00.000Z" }] });
    expect(activeSession(s)?.id).toBe("s1");
  });
});
