import { useMemo } from "react";
import { CATEGORIES } from "@/config/categories";
import { QUESTIONS } from "@/data/questions";
import { toAnalytics, useStore } from "@/lib/store";
import { href } from "@/lib/router";
import { computeStreak } from "@/features/dashboard/domain/streak";
import {
  answerPace,
  categoryProgress,
  dailyTrend,
  EXAM_SEC_PER_QUESTION,
  firstTryStats,
  recentStats,
  repeatStats,
  statsByDifficulty,
  studyDayCount,
} from "@/features/dashboard/domain/analytics";
import { PASSING_RATE } from "@/features/quiz/domain/scoring";
import { DIFFICULTY_LABEL } from "@/features/quiz/components/question-view";
import { Card, cn, Page, PageHeader, ProgressBar, SectionTitle, Stat } from "@/components/ui";

const TREND_DAYS = 14;

export function DashboardPage() {
  const { state } = useStore();
  const data = useMemo(() => {
    const a = toAnalytics(state.answers);
    const now = new Date();
    const progress = categoryProgress(a, QUESTIONS);
    const totalPool = QUESTIONS.length;
    const coveredAll = progress.reduce((s, p) => s + p.covered, 0);
    const masteredAll = progress.reduce((s, p) => s + p.masteredNow, 0);
    /** 配点で重み付けした初見正答率。本番の得点に近い見込み値 */
    let wSum = 0;
    let wAcc = 0;
    for (const c of CATEGORIES) {
      const p = progress.find((x) => x.slug === c.slug);
      if (p?.firstTry.accuracy == null) continue;
      wSum += c.weight;
      wAcc += c.weight * p.firstTry.accuracy;
    }
    return {
      answers: a,
      first: firstTryStats(a),
      repeat: repeatStats(a),
      recent: recentStats(a, 30),
      streak: computeStreak(a.map((x) => x.answeredAt), now),
      days: studyDayCount(a),
      trend: dailyTrend(a, TREND_DAYS, now),
      difficulty: statsByDifficulty(a),
      pace: answerPace(a),
      progress,
      totalPool,
      coveredAll,
      masteredAll,
      weighted: wSum > 0 ? Math.round(wAcc / wSum) : null,
      weightedCoverage: wSum,
    };
  }, [state.answers]);

  if (data.answers.length === 0) {
    return (
      <>
        <PageHeader title="ダッシュボード" />
        <Page>
          <Card className="p-5 flex flex-col gap-2">
            <p className="font-bold">まだ学習記録がありません</p>
            <p className="text-sm text-muted">「今日の10問」か分野別学習で問題を解くと、分野別の初見正答率・消化率・解答スピードがここに表示されます。</p>
            <a href={href("")} className="text-sm font-bold text-brandText">
              ホームへ戻る
            </a>
          </Card>
        </Page>
      </>
    );
  }

  const maxDay = Math.max(1, ...data.trend.map((d) => d.total));
  const weakest = [...data.progress]
    .filter((p) => p.firstTry.accuracy !== null)
    .sort((a, b) => (a.firstTry.accuracy ?? 0) - (b.firstTry.accuracy ?? 0))
    .slice(0, 3);

  return (
    <>
      <PageHeader title="ダッシュボード" sub="学習の進捗" />
      <Page>
        <Card className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="初見正答率" value={data.first.accuracy ?? "-"} unit="%" note={`${data.first.correct}/${data.first.total}問`} />
            <Stat label="配点加重の見込み" value={data.weighted ?? "-"} unit={data.weighted !== null ? "%" : undefined} note={`合格ライン ${PASSING_RATE}%`} />
            <Stat label="連続学習" value={data.streak} unit="日" note={`学習日数 ${data.days}日`} />
            <Stat label="累計回答" value={data.answers.length} unit="問" note={`直近30問 ${data.recent.accuracy ?? "-"}%`} />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-muted tnum">
              <span>消化 {data.coveredAll}/{data.totalPool}</span>
              <span>今解ける {data.masteredAll}/{data.totalPool}</span>
            </div>
            <ProgressBar value={(data.masteredAll / data.totalPool) * 100} tone="ok" />
          </div>
          <p className="text-[11px] text-muted">
            初見正答率は各問題の1回目だけで計算します（解き直すほど上がる総合正答率より実力に近い）。配点加重の見込みは、解いた分野の初見正答率を試験ガイドの配点で重み付けした値です。{data.repeat.accuracy === null ? "解き直した問題はまだありません。" : `復習（2回目以降）の正答率は ${data.repeat.accuracy}%。`}
          </p>
        </Card>

        <Card className="p-5 flex flex-col gap-3">
          <SectionTitle>分野別（初見正答率）</SectionTitle>
          {CATEGORIES.map((c) => {
            const p = data.progress.find((x) => x.slug === c.slug);
            const acc = p?.firstTry.accuracy ?? null;
            return (
              <a key={c.slug} href={href(`questions/${c.slug}`)} className="flex flex-col gap-1 rounded-md -mx-2 px-2 py-1 hover:bg-surface2">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    {c.short}
                    <span className="text-[11px] text-muted ml-1.5 tnum">配点{c.weight}%</span>
                  </span>
                  <span className="tnum shrink-0">
                    <span className="text-[11px] text-muted mr-2">
                      消化 {p?.covered ?? 0}/{p?.poolSize ?? 0}
                    </span>
                    <span className={cn("font-bold", acc === null ? "text-muted" : acc >= PASSING_RATE ? "text-ok" : "text-ng")}>{acc === null ? "未学習" : `${acc}%`}</span>
                  </span>
                </div>
                <ProgressBar value={acc ?? 0} tone={acc !== null && acc >= PASSING_RATE ? "ok" : "ng"} marker={PASSING_RATE} />
              </a>
            );
          })}
        </Card>

        {weakest.length > 0 && (
          <Card className="p-5 flex flex-col gap-2">
            <SectionTitle>苦手分野ランキング</SectionTitle>
            <ol className="flex flex-col gap-1.5">
              {weakest.map((p, i) => (
                <li key={p.slug} className="flex items-center gap-3 text-sm">
                  <span className="mono text-xs text-muted w-4 tnum">{i + 1}</span>
                  <span className="flex-1 min-w-0 truncate">{CATEGORIES.find((c) => c.slug === p.slug)?.name}</span>
                  <span className={cn("font-bold tnum", (p.firstTry.accuracy ?? 0) >= PASSING_RATE ? "text-ok" : "text-ng")}>{p.firstTry.accuracy}%</span>
                </li>
              ))}
            </ol>
          </Card>
        )}

        <Card className="p-5 flex flex-col gap-3">
          <SectionTitle>直近{TREND_DAYS}日の回答数</SectionTitle>
          <div className="flex items-end gap-1 h-28" role="img" aria-label={`直近${TREND_DAYS}日の日別回答数`}>
            {data.trend.map((d) => (
              <div key={d.date} className="flex-1 h-full flex flex-col justify-end items-center gap-1 min-w-0" title={`${d.date}：${d.total}問（正答 ${d.correct}）`}>
                {d.total > 0 && <span className="text-[10px] tnum text-muted">{d.total}</span>}
                <div className="w-full rounded-t bg-ngSoft flex flex-col justify-end overflow-hidden" style={{ height: `${(d.total / maxDay) * 100}%`, minHeight: d.total ? 4 : 2 }}>
                  <div className="w-full bg-ok" style={{ height: d.total ? `${(d.correct / d.total) * 100}%` : 0 }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted tnum">
            <span>{data.trend[0]?.date.slice(5)}</span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-ok" />
                正解
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-ngSoft border border-ng" />
                不正解
              </span>
            </span>
            <span>今日</span>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5 flex flex-col gap-2">
            <SectionTitle>難易度別</SectionTitle>
            {data.difficulty.map((d) => (
              <div key={d.difficulty} className="flex items-center justify-between text-sm tnum">
                <span>{DIFFICULTY_LABEL[d.difficulty]}</span>
                <span className="text-muted text-xs">{d.tally.total}問</span>
                <span className="font-bold w-12 text-right">{d.tally.accuracy === null ? "-" : `${d.tally.accuracy}%`}</span>
              </div>
            ))}
          </Card>
          <Card className="p-5 flex flex-col gap-2">
            <SectionTitle>解答スピード</SectionTitle>
            <Stat label="1問あたり（中央値）" value={data.pace.medianSec ?? "-"} unit={data.pace.medianSec !== null ? "秒" : undefined} />
            <p className="text-xs text-muted tnum">
              本番の持ち時間（{EXAM_SEC_PER_QUESTION}秒）以内：{data.pace.withinExamRate ?? "-"}%
            </p>
          </Card>
        </div>
      </Page>
    </>
  );
}
