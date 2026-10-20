/**
 * 出題選定ロジック（純関数）。モードごとに出題する問題 ID の順序付きリストを決める。
 *
 * - 今日の10問 / 分野別: 復習優先度順（priority.ts）
 * - 弱点克服: 初見正答率の低い分野を主軸に優先度順
 * - 間違い復習: 直近が不正解の問題
 * - 模試: 試験ガイドの配点で分野を按分し、分野内はランダム（実力測定なので復習優先にしない）
 */
import { selectByPriority, type QuestionState } from "@/features/review/domain/priority";

export type PoolQuestion = { id: string; category: string };

/** Fisher–Yates。rng を注入してテストで固定できるようにする */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 総数 total を重み weights で整数に按分する（ドント方式）。
 * 1問ずつ「重み ÷ (割当済み + 1)」が最大の分野へ配るので、配点に比例し、
 * 問題数の上限 caps に達した分野は飛ばして残りを他分野へ回せる。
 */
export function apportion(total: number, weights: Record<string, number>, caps: Record<string, number>): Record<string, number> {
  const keys = Object.keys(weights);
  const result: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));
  for (let i = 0; i < total; i++) {
    let best: string | null = null;
    let bestScore = -1;
    for (const k of keys) {
      if (result[k] >= (caps[k] ?? 0)) continue;
      const score = weights[k] / (result[k] + 1);
      if (score > bestScore) {
        best = k;
        bestScore = score;
      }
    }
    if (best === null) break;
    result[best] += 1;
  }
  return result;
}

/** 優先度順に count 件 */
export function selectPrioritized(pool: PoolQuestion[], states: QuestionState[], count: number, now: Date, rng?: () => number): string[] {
  const ids = new Set(pool.map((q) => q.id));
  return selectByPriority(states.filter((s) => ids.has(s.questionId)), count, now, rng);
}

/**
 * 弱点克服: 分野の初見正答率が低い順に分野を並べ、各分野が残り枠の6割ずつを優先度順に埋める
 * （10問なら最も苦手な分野から6問、次の分野から3問、…）。
 * 未学習の分野は正答率不明として、学習済みの苦手分野の次に回す。
 */
export function selectWeakness(
  pool: PoolQuestion[],
  states: QuestionState[],
  categoryAccuracy: Record<string, number | null>,
  count: number,
  now: Date,
  rng?: () => number,
): string[] {
  const cats = [...new Set(pool.map((q) => q.category))].sort((a, b) => {
    const x = categoryAccuracy[a];
    const y = categoryAccuracy[b];
    if (x == null && y == null) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    return x - y;
  });
  const result: string[] = [];
  for (const c of cats) {
    if (result.length >= count) break;
    const inCat = pool.filter((q) => q.category === c);
    const quota = Math.ceil((count - result.length) * 0.6);
    const picked = selectPrioritized(inCat, states, quota, now, rng);
    for (const id of picked) {
      if (result.length < count) result.push(id);
    }
  }
  return result;
}

/** 模試: 配点で按分し、分野内はランダム。最後に全体をシャッフルして本番のように分野を混ぜる */
export function selectMock(pool: PoolQuestion[], weights: Record<string, number>, count: number, rng: () => number = Math.random): string[] {
  const caps: Record<string, number> = {};
  for (const q of pool) caps[q.category] = (caps[q.category] ?? 0) + 1;
  const w = Object.fromEntries(Object.keys(caps).map((k) => [k, weights[k] ?? 1]));
  const plan = apportion(count, w, caps);
  const picked: string[] = [];
  for (const [cat, n] of Object.entries(plan)) {
    const inCat = shuffle(pool.filter((q) => q.category === cat), rng);
    picked.push(...inCat.slice(0, n).map((q) => q.id));
  }
  return shuffle(picked, rng);
}
