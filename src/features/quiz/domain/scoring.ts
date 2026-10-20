/**
 * 採点・結果分析ロジック（純関数）。
 *
 * 本番の複数選択問題は部分点がないため、正誤判定は「正解の集合と選択の集合が完全一致」のみを正解とする。
 * セッション結果の分野別集計・苦手分野・推奨テーマの導出は gmap-drill の scoring と同じ考え方。
 */

/** 本番の合格ラインの目安（%） */
export const PASSING_RATE = 65;

/**
 * ALL or NOTHING の正誤判定。選択の順序は問わない。
 * 選択数が正解数と異なる場合は、1つでも余分・不足があるので不正解。
 */
export function isAllOrNothingCorrect(answer: readonly string[], selected: readonly string[]): boolean {
  if (answer.length !== selected.length) return false;
  const set = new Set(selected);
  if (set.size !== selected.length) return false;
  return answer.every((k) => set.has(k));
}

/** 正解のうち選べていた数（部分点の代わりに「惜しさ」を伝えるための表示用） */
export function countHits(answer: readonly string[], selected: readonly string[]): number {
  const set = new Set(answer);
  return selected.filter((k) => set.has(k)).length;
}

export type ScoredAnswer = {
  categorySlug: string;
  categoryName: string;
  isCorrect: boolean;
};

export type CategoryStat = {
  slug: string;
  name: string;
  total: number;
  correct: number;
  /** 0-100 の正答率。母数0なら null */
  accuracy: number | null;
};

export type SessionResult = {
  total: number;
  correct: number;
  /** 0-100 */
  accuracy: number;
  passed: boolean;
  byCategory: CategoryStat[];
  weakAreas: CategoryStat[];
  recommendations: string[];
};

/** 正答率(0-100)を四捨五入で計算。母数0なら null */
export function accuracyRate(correct: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((correct / total) * 100);
}

/** 分野別に集計する（初出順） */
export function aggregateByCategory(answers: ScoredAnswer[]): CategoryStat[] {
  const map = new Map<string, CategoryStat>();
  for (const a of answers) {
    const cur = map.get(a.categorySlug) ?? {
      slug: a.categorySlug,
      name: a.categoryName,
      total: 0,
      correct: 0,
      accuracy: null,
    };
    cur.total += 1;
    if (a.isCorrect) cur.correct += 1;
    map.set(a.categorySlug, cur);
  }
  for (const stat of map.values()) {
    stat.accuracy = accuracyRate(stat.correct, stat.total);
  }
  return [...map.values()];
}

/** 正答率が threshold(%) 未満の分野を、正答率の低い順に返す */
export function deriveWeakAreas(byCategory: CategoryStat[], threshold = PASSING_RATE): CategoryStat[] {
  return byCategory
    .filter((c) => c.accuracy !== null && c.accuracy < threshold)
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));
}

/** 苦手分野から推奨テーマ文を生成 */
export function buildRecommendations(weakAreas: CategoryStat[]): string[] {
  if (weakAreas.length === 0) {
    return ["全分野で合格ラインを超えています。本番形式の模試で時間配分も確認しましょう。"];
  }
  return weakAreas
    .slice(0, 3)
    .map((c) => `「${c.name}」の正答率が${c.accuracy}%です。分野別学習で解説の「なぜこの仕様か」まで読み直しましょう。`);
}

/** セッション結果をまとめて算出する。未回答は不正解として数える */
export function scoreSession(answers: ScoredAnswer[]): SessionResult {
  const total = answers.length;
  const correct = answers.filter((a) => a.isCorrect).length;
  const accuracy = accuracyRate(correct, total) ?? 0;
  const byCategory = aggregateByCategory(answers);
  const weakAreas = deriveWeakAreas(byCategory);
  return {
    total,
    correct,
    accuracy,
    passed: accuracy >= PASSING_RATE,
    byCategory,
    weakAreas,
    recommendations: buildRecommendations(weakAreas),
  };
}
