/**
 * 復習優先度ロジック（純関数・副作用なし）。
 * 設計書 §7 の優先順位を実装する。DB やフレームワークに依存しない。
 *
 * 優先順位（高い順）:
 *   1. 今日間違えた問題
 *   2. 過去3日以内に間違えた問題
 *   3. 過去7日以内に間違えた問題
 *   (3.5 それ以前に間違えたまま放置の問題 — 復習対象として未回答より上位)
 *   4. 未回答問題
 *   5. 正解済み問題
 */

/** ユーザの「ある問題に対する直近状態」 */
export type QuestionState = {
  questionId: string;
  /** 直近の正誤。未回答は null */
  lastResult: boolean | null;
  /** 直近の回答日時。未回答は null */
  lastAnsweredAt: Date | null;
};

export const PriorityBucket = {
  WRONG_TODAY: "WRONG_TODAY",
  WRONG_3D: "WRONG_3D",
  WRONG_7D: "WRONG_7D",
  WRONG_STALE: "WRONG_STALE",
  UNANSWERED: "UNANSWERED",
  CORRECT: "CORRECT",
} as const;

export type PriorityBucket =
  (typeof PriorityBucket)[keyof typeof PriorityBucket];

/** 各バケットの基礎スコア（大きいほど優先） */
const BUCKET_BASE_SCORE: Record<PriorityBucket, number> = {
  WRONG_TODAY: 1000,
  WRONG_3D: 800,
  WRONG_7D: 600,
  WRONG_STALE: 500,
  UNANSWERED: 400,
  CORRECT: 100,
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** 2つの日時が同一カレンダー日か（ローカル時刻基準） */
function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** 経過日数（カレンダー差。今日=0, 昨日=1 ...） */
function calendarDaysBetween(from: Date, to: Date): number {
  const f = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const t = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((t.getTime() - f.getTime()) / MS_PER_DAY);
}

export type PriorityResult = {
  questionId: string;
  bucket: PriorityBucket;
  score: number;
};

/**
 * 1問の優先度を算出する。
 * @param state 問題に対する直近状態
 * @param now 現在時刻（テスト容易性のため引数化）
 */
export function computePriority(
  state: QuestionState,
  now: Date,
): PriorityResult {
  const { questionId, lastResult, lastAnsweredAt } = state;

  let bucket: PriorityBucket;

  if (lastResult === null || lastAnsweredAt === null) {
    bucket = PriorityBucket.UNANSWERED;
  } else if (lastResult === true) {
    bucket = PriorityBucket.CORRECT;
  } else {
    // 直近が誤答 → 経過日数でバケット分け
    const days = calendarDaysBetween(lastAnsweredAt, now);
    if (isSameCalendarDay(lastAnsweredAt, now)) {
      bucket = PriorityBucket.WRONG_TODAY;
    } else if (days <= 3) {
      bucket = PriorityBucket.WRONG_3D;
    } else if (days <= 7) {
      bucket = PriorityBucket.WRONG_7D;
    } else {
      bucket = PriorityBucket.WRONG_STALE;
    }
  }

  // 忘却ブースト: 最後に解いてから時間が経つほど僅かに加点（同バケット内の単調化を防ぐ）
  let recencyBoost = 0;
  if (lastAnsweredAt) {
    const days = Math.max(0, calendarDaysBetween(lastAnsweredAt, now));
    // 上限を設けて他バケットを侵食しないよう 0〜50 に収める
    recencyBoost = Math.min(50, days * 2);
  }

  return {
    questionId,
    bucket,
    score: BUCKET_BASE_SCORE[bucket] + recencyBoost,
  };
}

/**
 * 優先度順に並べ、上位 count 件の questionId を返す。
 * 同点はランダムタイブレーク（rng は注入可能でテスト時に固定できる）。
 */
export function selectByPriority(
  states: QuestionState[],
  count: number,
  now: Date,
  rng: () => number = Math.random,
): string[] {
  const scored = states.map((s) => ({
    ...computePriority(s, now),
    jitter: rng(),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.jitter - a.jitter;
  });

  return scored.slice(0, count).map((s) => s.questionId);
}
