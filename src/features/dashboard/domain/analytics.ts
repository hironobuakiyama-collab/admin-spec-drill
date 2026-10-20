/**
 * 学習履歴の分析ロジック（純関数）。gmap-drill の analytics を移植したもの。
 *
 * 同じ問題を解き直すほど総合正答率は上がるため、実力の目安には各問題の1回目だけを見る初見正答率を使う。
 * 解答時間は端末で問題ごとに計測した elapsedMs をそのまま使う（本番は 60問105分 = 1問あたり105秒）。
 */

export type DifficultyKey = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type AnalyticsRecord = {
  questionId: string;
  isCorrect: boolean;
  answeredAt: Date;
  elapsedMs: number;
  categorySlug: string;
  difficulty: DifficultyKey;
};

export type Tally = { total: number; correct: number; accuracy: number | null };

/** 本番の1問あたりの持ち時間（秒） */
export const EXAM_SEC_PER_QUESTION = 105;

/** これを超える解答時間は中断とみなして速度計算から除外する（秒） */
export const MAX_ANSWER_SEC = 600;

function tally(records: AnalyticsRecord[]): Tally {
  const total = records.length;
  const correct = records.filter((a) => a.isCorrect).length;
  return { total, correct, accuracy: total > 0 ? Math.round((correct / total) * 100) : null };
}

function sortByTime(answers: AnalyticsRecord[]): AnalyticsRecord[] {
  return [...answers].sort((a, b) => +a.answeredAt - +b.answeredAt);
}

/** 各問題の初回の回答だけを古い順に抽出する */
export function firstTryAnswers(answers: AnalyticsRecord[]): AnalyticsRecord[] {
  const seen = new Set<string>();
  const result: AnalyticsRecord[] = [];
  for (const a of sortByTime(answers)) {
    if (seen.has(a.questionId)) continue;
    seen.add(a.questionId);
    result.push(a);
  }
  return result;
}

export function firstTryStats(answers: AnalyticsRecord[]): Tally {
  return tally(firstTryAnswers(answers));
}

/** 2回目以降（復習）の成績 */
export function repeatStats(answers: AnalyticsRecord[]): Tally {
  const first = new Set<AnalyticsRecord>(firstTryAnswers(answers));
  return tally(answers.filter((a) => !first.has(a)));
}

/** 直近 n 件の成績 */
export function recentStats(answers: AnalyticsRecord[], n: number): Tally {
  return tally(sortByTime(answers).slice(-n));
}

export function statsByDifficulty(answers: AnalyticsRecord[]): { difficulty: DifficultyKey; tally: Tally }[] {
  const order: DifficultyKey[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
  return order.map((d) => ({ difficulty: d, tally: tally(answers.filter((a) => a.difficulty === d)) }));
}

export type CategoryProgress = {
  slug: string;
  /** 分野の問題数 */
  poolSize: number;
  /** 1回以上解いた問題数 */
  covered: number;
  firstTry: Tally;
  /** 各問題の最新回答が正解の問題数（「今解ける」問題数） */
  masteredNow: number;
};

/** 分野ごとの消化状況と初見正答率 */
export function categoryProgress(
  answers: AnalyticsRecord[],
  pool: { id: string; category: string }[],
): CategoryProgress[] {
  const cats = [...new Set(pool.map((q) => q.category))];
  const first = firstTryAnswers(answers);
  const latest = new Map<string, AnalyticsRecord>();
  for (const a of sortByTime(answers)) latest.set(a.questionId, a);

  return cats.map((slug) => {
    const ids = new Set(pool.filter((q) => q.category === slug).map((q) => q.id));
    const covered = [...ids].filter((id) => latest.has(id)).length;
    const masteredNow = [...ids].filter((id) => latest.get(id)?.isCorrect).length;
    return {
      slug,
      poolSize: ids.size,
      covered,
      firstTry: tally(first.filter((a) => ids.has(a.questionId))),
      masteredNow,
    };
  });
}

export type DailyPoint = { date: string; total: number; correct: number; accuracy: number };

/** 直近 days 日の日別成績を古い順に返す。学習していない日も 0 件で含める */
export function dailyTrend(answers: AnalyticsRecord[], days: number, now: Date): DailyPoint[] {
  const map = new Map<string, { total: number; correct: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    map.set(toDateKey(d), { total: 0, correct: 0 });
  }
  for (const a of answers) {
    const cur = map.get(toDateKey(a.answeredAt));
    if (!cur) continue;
    cur.total += 1;
    if (a.isCorrect) cur.correct += 1;
  }
  return [...map.entries()].map(([date, v]) => ({
    date,
    total: v.total,
    correct: v.correct,
    accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
  }));
}

export function toDateKey(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function studyDayCount(answers: { answeredAt: Date }[]): number {
  return new Set(answers.map((a) => toDateKey(a.answeredAt))).size;
}

export type PaceStats = {
  samples: number;
  medianSec: number | null;
  /** 本番の持ち時間（105秒）以内に答えられた割合 */
  withinExamRate: number | null;
};

export function answerPace(answers: AnalyticsRecord[]): PaceStats {
  const secs = answers
    .map((a) => a.elapsedMs / 1000)
    .filter((s) => s > 0 && s < MAX_ANSWER_SEC)
    .sort((a, b) => a - b);
  if (secs.length === 0) return { samples: 0, medianSec: null, withinExamRate: null };
  return {
    samples: secs.length,
    medianSec: Math.round(median(secs)),
    withinExamRate: Math.round((secs.filter((s) => s <= EXAM_SEC_PER_QUESTION).length / secs.length) * 100),
  };
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
