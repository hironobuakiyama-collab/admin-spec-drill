/**
 * 連続学習日数（ストリーク）の算出（純関数）。
 * 回答日時の集合から、今日（または昨日）を起点に連続して学習した日数を数える。
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function toDayKey(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * 学習した日（重複可）の配列から連続学習日数を計算する。
 * - 今日学習していれば今日起点で連続日数を数える
 * - 今日未学習でも昨日まで連続していれば、その連続日数を維持して返す
 * - 2日以上空いていれば 0
 *
 * @param studiedAt 学習（回答）日時の配列
 * @param now 現在時刻
 */
export function computeStreak(studiedAt: Date[], now: Date): number {
  if (studiedAt.length === 0) return 0;

  const days = new Set(studiedAt.map(toDayKey));
  const today = toDayKey(now);
  const yesterday = today - MS_PER_DAY;

  // 起点: 今日学習済みなら今日、未学習でも昨日学習済みなら昨日。どちらもなければ 0。
  let cursor: number;
  if (days.has(today)) {
    cursor = today;
  } else if (days.has(yesterday)) {
    cursor = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= MS_PER_DAY;
  }
  return streak;
}
