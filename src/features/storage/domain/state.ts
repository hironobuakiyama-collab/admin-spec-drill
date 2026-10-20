/**
 * 端末に保存するアプリ状態と、その検証・バックアップ形式（純関数）。
 *
 * localStorage は壊れていたり古い形式だったりするため、読み込み時は必ず parseState を通し、
 * 不正なレコードは捨てて読める部分だけを残す。
 */
import type { AnswerRecord, Session, StudyMode } from "@/features/history/domain/records";

export const STATE_VERSION = 2;

export type AppState = {
  version: typeof STATE_VERSION;
  answers: AnswerRecord[];
  sessions: Session[];
  bookmarks: string[];
};

export const EMPTY_STATE: AppState = { version: STATE_VERSION, answers: [], sessions: [], bookmarks: [] };

const MODES: StudyMode[] = ["DAILY", "CATEGORY", "WEAKNESS", "MISTAKES", "BOOKMARKS", "MOCK"];

const isStr = (v: unknown): v is string => typeof v === "string";
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const isIso = (v: unknown): v is string => isStr(v) && !Number.isNaN(Date.parse(v));

function parseAnswer(v: unknown): AnswerRecord | null {
  if (!v || typeof v !== "object") return null;
  const a = v as Record<string, unknown>;
  if (!isStr(a.questionId) || !isStrArr(a.selected) || typeof a.isCorrect !== "boolean" || !isIso(a.answeredAt) || !isStr(a.sessionId)) {
    return null;
  }
  return {
    questionId: a.questionId,
    selected: a.selected,
    isCorrect: a.isCorrect,
    answeredAt: a.answeredAt,
    sessionId: a.sessionId,
    elapsedMs: typeof a.elapsedMs === "number" && a.elapsedMs >= 0 ? a.elapsedMs : 0,
  };
}

function parseSession(v: unknown): Session | null {
  if (!v || typeof v !== "object") return null;
  const s = v as Record<string, unknown>;
  if (!isStr(s.id) || !MODES.includes(s.mode as StudyMode) || !isStr(s.title) || !isStrArr(s.questionIds) || !isIso(s.startedAt)) {
    return null;
  }
  if (s.questionIds.length === 0) return null;
  const responses: Session["responses"] = {};
  if (s.responses && typeof s.responses === "object") {
    for (const [qid, r] of Object.entries(s.responses as Record<string, unknown>)) {
      const rr = r as Record<string, unknown> | null;
      if (rr && isStrArr(rr.selected) && typeof rr.locked === "boolean") {
        responses[qid] = { selected: rr.selected, locked: rr.locked, elapsedMs: typeof rr.elapsedMs === "number" ? rr.elapsedMs : 0 };
      }
    }
  }
  const idx = typeof s.currentIndex === "number" ? s.currentIndex : 0;
  return {
    id: s.id,
    mode: s.mode as StudyMode,
    title: s.title,
    categorySlug: isStr(s.categorySlug) ? s.categorySlug : undefined,
    questionIds: s.questionIds,
    startedAt: s.startedAt,
    finishedAt: isIso(s.finishedAt) ? s.finishedAt : undefined,
    deadline: isIso(s.deadline) ? s.deadline : undefined,
    currentIndex: Math.min(Math.max(0, Math.floor(idx)), s.questionIds.length - 1),
    responses,
    flagged: isStrArr(s.flagged) ? s.flagged : [],
  };
}

/**
 * 任意の値を AppState に正規化する。
 * knownIds を渡すと、問題データから消えた問題への参照を取り除く。
 */
export function parseState(raw: unknown, knownIds?: Set<string>): AppState {
  if (!raw || typeof raw !== "object") return { ...EMPTY_STATE };
  const r = raw as Record<string, unknown>;
  const known = (id: string) => !knownIds || knownIds.has(id);

  const answers = (Array.isArray(r.answers) ? r.answers : [])
    .map(parseAnswer)
    .filter((a): a is AnswerRecord => a !== null && known(a.questionId));

  const sessions = (Array.isArray(r.sessions) ? r.sessions : [])
    .map(parseSession)
    .filter((s): s is Session => s !== null)
    .map((s) => ({ ...s, questionIds: s.questionIds.filter(known) }))
    .filter((s) => s.questionIds.length > 0)
    .map((s) => ({ ...s, currentIndex: Math.min(s.currentIndex, s.questionIds.length - 1) }));

  const bookmarks = isStrArr(r.bookmarks) ? [...new Set(r.bookmarks.filter(known))] : [];

  return { version: STATE_VERSION, answers, sessions, bookmarks };
}

/** バックアップの取り込み。同じ回答（問題・日時・セッションが一致）は重複させない */
export function mergeStates(base: AppState, incoming: AppState): AppState {
  const key = (a: AnswerRecord) => `${a.questionId}|${a.answeredAt}|${a.sessionId}`;
  const seen = new Set(base.answers.map(key));
  const answers = [...base.answers, ...incoming.answers.filter((a) => !seen.has(key(a)))];
  const sessionIds = new Set(base.sessions.map((s) => s.id));
  const sessions = [...base.sessions, ...incoming.sessions.filter((s) => !sessionIds.has(s.id))];
  const bookmarks = [...new Set([...base.bookmarks, ...incoming.bookmarks])];
  return { version: STATE_VERSION, answers, sessions, bookmarks };
}

/** 進行中（未終了）のセッションのうち最新のもの */
export function activeSession(state: AppState): Session | undefined {
  return [...state.sessions].filter((s) => !s.finishedAt).sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0];
}
