/**
 * 学習記録の型と、記録から各種状態を再構成する純関数。
 *
 * gmap-drill と同じく「回答履歴（AnswerRecord）を唯一の真実」とし、
 * 復習優先度・ダッシュボード集計はすべて履歴から導出する。保存先は端末の localStorage。
 */
import type { QuestionState } from "@/features/review/domain/priority";

export type StudyMode = "DAILY" | "CATEGORY" | "WEAKNESS" | "MISTAKES" | "BOOKMARKS" | "MOCK";

export type AnswerRecord = {
  questionId: string;
  selected: string[];
  isCorrect: boolean;
  /** ISO 8601 */
  answeredAt: string;
  sessionId: string;
  /** 問題を表示してから確定するまでの時間 */
  elapsedMs: number;
};

export type SessionResponse = {
  selected: string[];
  /** 確定済みか（模試では終了時にまとめて確定する） */
  locked: boolean;
  elapsedMs: number;
};

export type Session = {
  id: string;
  mode: StudyMode;
  title: string;
  /** 分野別学習のときの分野 */
  categorySlug?: string;
  questionIds: string[];
  /** ISO 8601 */
  startedAt: string;
  finishedAt?: string;
  /** 模試の制限時刻（ISO 8601） */
  deadline?: string;
  currentIndex: number;
  responses: Record<string, SessionResponse>;
  /** 模試の「見直し」フラグ */
  flagged: string[];
};

/** 問題ごとの最新回答から、復習優先度の入力となる状態を作る */
export function buildQuestionStates(questionIds: string[], answers: AnswerRecord[]): QuestionState[] {
  const latest = new Map<string, AnswerRecord>();
  for (const a of answers) {
    const cur = latest.get(a.questionId);
    if (!cur || cur.answeredAt < a.answeredAt) latest.set(a.questionId, a);
  }
  return questionIds.map((id) => {
    const l = latest.get(id);
    return {
      questionId: id,
      lastResult: l ? l.isCorrect : null,
      lastAnsweredAt: l ? new Date(l.answeredAt) : null,
    };
  });
}

/** 直近の回答が不正解の問題 ID（最近間違えた順） */
export function currentMistakes(answers: AnswerRecord[]): string[] {
  const latest = new Map<string, AnswerRecord>();
  for (const a of answers) {
    const cur = latest.get(a.questionId);
    if (!cur || cur.answeredAt < a.answeredAt) latest.set(a.questionId, a);
  }
  return [...latest.values()]
    .filter((a) => !a.isCorrect)
    .sort((a, b) => (a.answeredAt < b.answeredAt ? 1 : -1))
    .map((a) => a.questionId);
}

/** 1問の回答履歴（新しい順） */
export function historyOf(questionId: string, answers: AnswerRecord[]): AnswerRecord[] {
  return answers
    .filter((a) => a.questionId === questionId)
    .sort((a, b) => (a.answeredAt < b.answeredAt ? 1 : -1));
}
