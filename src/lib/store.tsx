import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { QUESTIONS, getQuestion } from "@/data/questions";
import { CATEGORIES, getCategory } from "@/config/categories";
import { EMPTY_STATE, mergeStates, parseState, type AppState } from "@/features/storage/domain/state";
import { buildQuestionStates, currentMistakes, type AnswerRecord, type Session, type StudyMode } from "@/features/history/domain/records";
import { selectMock, selectPrioritized, selectWeakness, shuffle } from "@/features/quiz/domain/selection";
import { isAllOrNothingCorrect } from "@/features/quiz/domain/scoring";
import { firstTryStats, type AnalyticsRecord } from "@/features/dashboard/domain/analytics";

const STORAGE_KEY = "admin-spec-drill:state";
const KNOWN_IDS = new Set(QUESTIONS.map((q) => q.id));

export const DAILY_COUNT = 10;
export const STUDY_COUNT = 10;
export const MISTAKES_MAX = 20;
export const BOOKMARKS_MAX = 30;

/** 模試の設定。本番は 60問 105分（1問 1.75分）なので、短縮版も同じペースにする */
export const MOCK_PRESETS = [
  { count: 20, minutes: 35, label: "ミニ模試" },
  { count: 40, minutes: 70, label: "ハーフ模試" },
  { count: 60, minutes: 105, label: "本番形式" },
] as const;

export type StartOptions =
  | { mode: "DAILY" }
  | { mode: "CATEGORY"; categorySlug: string }
  | { mode: "WEAKNESS" }
  | { mode: "MISTAKES" }
  | { mode: "BOOKMARKS" }
  | { mode: "MOCK"; count: number; minutes: number };

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseState(JSON.parse(raw), KNOWN_IDS) : { ...EMPTY_STATE };
  } catch {
    return { ...EMPTY_STATE };
  }
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 回答履歴を分析用レコードに変換する */
export function toAnalytics(answers: AnswerRecord[]): AnalyticsRecord[] {
  return answers.flatMap((a) => {
    const q = getQuestion(a.questionId);
    if (!q) return [];
    return [{ questionId: a.questionId, isCorrect: a.isCorrect, answeredAt: new Date(a.answeredAt), elapsedMs: a.elapsedMs, categorySlug: q.category, difficulty: q.difficulty }];
  });
}

/** 出題する問題 ID を決める。空なら出題できる問題がない */
export function pickQuestionIds(state: AppState, opts: StartOptions, now = new Date()): string[] {
  const pool = QUESTIONS.map((q) => ({ id: q.id, category: q.category }));
  const states = buildQuestionStates(pool.map((q) => q.id), state.answers);
  switch (opts.mode) {
    case "DAILY":
      return selectPrioritized(pool, states, DAILY_COUNT, now);
    case "CATEGORY":
      return selectPrioritized(pool.filter((q) => q.category === opts.categorySlug), states, STUDY_COUNT, now);
    case "WEAKNESS": {
      const analytics = toAnalytics(state.answers);
      const acc = Object.fromEntries(
        CATEGORIES.map((c) => [c.slug, firstTryStats(analytics.filter((a) => a.categorySlug === c.slug)).accuracy]),
      );
      return selectWeakness(pool, states, acc, STUDY_COUNT, now);
    }
    case "MISTAKES":
      return shuffle(currentMistakes(state.answers).slice(0, MISTAKES_MAX));
    case "BOOKMARKS":
      return shuffle(state.bookmarks.filter((id) => KNOWN_IDS.has(id))).slice(0, BOOKMARKS_MAX);
    case "MOCK":
      return selectMock(pool, Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.weight])), opts.count);
  }
}

function sessionTitle(opts: StartOptions, count: number): string {
  switch (opts.mode) {
    case "DAILY":
      return `今日の${count}問`;
    case "CATEGORY":
      return `分野別：${getCategory(opts.categorySlug)?.short ?? opts.categorySlug}`;
    case "WEAKNESS":
      return "弱点克服";
    case "MISTAKES":
      return "間違い復習";
    case "BOOKMARKS":
      return "ブックマーク";
    case "MOCK":
      return `模試 ${count}問 / ${opts.minutes}分`;
  }
}

type Store = {
  state: AppState;
  startSession: (opts: StartOptions) => Session | null;
  /** 学習モード: 確定して履歴に記録する */
  submitAnswer: (sessionId: string, questionId: string, selected: string[], elapsedMs: number) => void;
  /** 模試: 選択だけを保存する（確定は終了時） */
  setDraft: (sessionId: string, questionId: string, selected: string[], addElapsedMs: number) => void;
  setIndex: (sessionId: string, index: number) => void;
  toggleFlag: (sessionId: string, questionId: string) => void;
  finishSession: (sessionId: string) => void;
  discardSession: (sessionId: string) => void;
  toggleBookmark: (questionId: string) => void;
  importBackup: (raw: unknown) => { answers: number; sessions: number };
  resetAll: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* 保存できない環境（プライベートブラウズ等）でもアプリは動かす */
    }
  }, [state]);

  const updateSession = useCallback((sessionId: string, fn: (s: Session) => Session) => {
    setState((st) => ({ ...st, sessions: st.sessions.map((s) => (s.id === sessionId ? fn(s) : s)) }));
  }, []);

  const startSession = useCallback((opts: StartOptions) => {
    const ids = pickQuestionIds(stateRef.current, opts);
    if (ids.length === 0) return null;
    const now = new Date();
    const session: Session = {
      id: newId(),
      mode: opts.mode as StudyMode,
      title: sessionTitle(opts, ids.length),
      categorySlug: opts.mode === "CATEGORY" ? opts.categorySlug : undefined,
      questionIds: ids,
      startedAt: now.toISOString(),
      deadline: opts.mode === "MOCK" ? new Date(now.getTime() + opts.minutes * 60_000).toISOString() : undefined,
      currentIndex: 0,
      responses: {},
      flagged: [],
    };
    setState((st) => ({
      ...st,
      sessions: [...st.sessions.map((s) => (s.finishedAt ? s : { ...s, finishedAt: now.toISOString() })), session],
    }));
    return session;
  }, []);

  const submitAnswer = useCallback((sessionId: string, questionId: string, selected: string[], elapsedMs: number) => {
    const q = getQuestion(questionId);
    if (!q) return;
    setState((st) => {
      const session = st.sessions.find((s) => s.id === sessionId);
      if (!session || session.responses[questionId]?.locked) return st;
      const record: AnswerRecord = {
        questionId,
        selected,
        isCorrect: isAllOrNothingCorrect(q.answer, selected),
        answeredAt: new Date().toISOString(),
        sessionId,
        elapsedMs,
      };
      return {
        ...st,
        answers: [...st.answers, record],
        sessions: st.sessions.map((s) =>
          s.id === sessionId ? { ...s, responses: { ...s.responses, [questionId]: { selected, locked: true, elapsedMs } } } : s,
        ),
      };
    });
  }, []);

  const setDraft = useCallback(
    (sessionId: string, questionId: string, selected: string[], addElapsedMs: number) => {
      updateSession(sessionId, (s) => {
        const prev = s.responses[questionId];
        if (prev?.locked) return s;
        return { ...s, responses: { ...s.responses, [questionId]: { selected, locked: false, elapsedMs: (prev?.elapsedMs ?? 0) + addElapsedMs } } };
      });
    },
    [updateSession],
  );

  const setIndex = useCallback(
    (sessionId: string, index: number) => updateSession(sessionId, (s) => ({ ...s, currentIndex: Math.max(0, Math.min(index, s.questionIds.length - 1)) })),
    [updateSession],
  );

  const toggleFlag = useCallback(
    (sessionId: string, questionId: string) =>
      updateSession(sessionId, (s) => ({
        ...s,
        flagged: s.flagged.includes(questionId) ? s.flagged.filter((id) => id !== questionId) : [...s.flagged, questionId],
      })),
    [updateSession],
  );

  const finishSession = useCallback((sessionId: string) => {
    setState((st) => {
      const session = st.sessions.find((s) => s.id === sessionId);
      if (!session || session.finishedAt) return st;
      const now = new Date().toISOString();
      const newRecords: AnswerRecord[] = [];
      const responses = { ...session.responses };
      if (session.mode === "MOCK") {
        for (const qid of session.questionIds) {
          const r = responses[qid];
          const q = getQuestion(qid);
          if (!q || !r || r.locked || r.selected.length === 0) continue;
          newRecords.push({ questionId: qid, selected: r.selected, isCorrect: isAllOrNothingCorrect(q.answer, r.selected), answeredAt: now, sessionId, elapsedMs: r.elapsedMs });
          responses[qid] = { ...r, locked: true };
        }
      }
      return {
        ...st,
        answers: [...st.answers, ...newRecords],
        sessions: st.sessions.map((s) => (s.id === sessionId ? { ...s, responses, finishedAt: now } : s)),
      };
    });
  }, []);

  const discardSession = useCallback((sessionId: string) => {
    setState((st) => ({
      ...st,
      sessions: st.sessions.filter((s) => s.id !== sessionId || Object.values(s.responses).some((r) => r.locked)).map((s) =>
        s.id === sessionId ? { ...s, finishedAt: new Date().toISOString() } : s,
      ),
    }));
  }, []);

  const toggleBookmark = useCallback((questionId: string) => {
    setState((st) => ({
      ...st,
      bookmarks: st.bookmarks.includes(questionId) ? st.bookmarks.filter((id) => id !== questionId) : [...st.bookmarks, questionId],
    }));
  }, []);

  const importBackup = useCallback((raw: unknown) => {
    const incoming = parseState(raw, KNOWN_IDS);
    const before = stateRef.current;
    const merged = mergeStates(before, incoming);
    setState(merged);
    return { answers: merged.answers.length - before.answers.length, sessions: merged.sessions.length - before.sessions.length };
  }, []);

  const resetAll = useCallback(() => setState({ ...EMPTY_STATE }), []);

  const value = useMemo<Store>(
    () => ({ state, startSession, submitAnswer, setDraft, setIndex, toggleFlag, finishSession, discardSession, toggleBookmark, importBackup, resetAll }),
    [state, startSession, submitAnswer, setDraft, setIndex, toggleFlag, finishSession, discardSession, toggleBookmark, importBackup, resetAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error("StoreProvider の外で useStore が呼ばれた");
  return s;
}
