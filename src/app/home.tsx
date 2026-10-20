import { useMemo, useState } from "react";
import { BookOpen, Bookmark, CalendarCheck, ChevronRight, ClipboardList, Flame, History, LayoutDashboard, ListChecks, PlayCircle, RotateCcw, Settings, Target } from "lucide-react";
import { QUESTIONS } from "@/data/questions";
import { DAILY_COUNT, MISTAKES_MAX, toAnalytics, useStore, type StartOptions } from "@/lib/store";
import { href, navigate } from "@/lib/router";
import { activeSession } from "@/features/storage/domain/state";
import { currentMistakes } from "@/features/history/domain/records";
import { computeStreak } from "@/features/dashboard/domain/streak";
import { firstTryStats } from "@/features/dashboard/domain/analytics";
import { Card, cn, Page } from "@/components/ui";

/** セッションを開始して出題画面へ。出題できる問題がなければメッセージを返す */
export function useStart() {
  const { startSession } = useStore();
  const [message, setMessage] = useState<string | null>(null);
  const start = (opts: StartOptions, emptyMessage: string) => {
    const s = startSession(opts);
    if (!s) {
      setMessage(emptyMessage);
      return;
    }
    setMessage(null);
    navigate(`session/${s.id}`);
  };
  return { start, message };
}

export function HomePage() {
  const { state } = useStore();
  const { start, message } = useStart();
  const resume = activeSession(state);
  const analytics = useMemo(() => toAnalytics(state.answers), [state.answers]);
  const streak = computeStreak(analytics.map((a) => a.answeredAt), new Date());
  const first = firstTryStats(analytics);
  const mistakes = currentMistakes(state.answers).length;
  const covered = new Set(state.answers.map((a) => a.questionId)).size;

  return (
    <>
      <header className="bg-band text-onBand">
        <div className="gutter">
          <div className="max-w-2xl mx-auto pt-4 pb-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] eyebrow opacity-80">SALESFORCE 認定 PLATFORM アドミニストレーター</p>
                <h1 className="text-xl font-black leading-tight">Admin Spec Drill</h1>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-btnHover px-3 py-1.5 text-sm font-bold shrink-0 tnum">
                <Flame className="w-4 h-4" />
                {streak}日連続
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <HeroStat label="初見正答率" value={first.accuracy === null ? "-" : `${first.accuracy}%`} />
              <HeroStat label="消化" value={`${covered}/${QUESTIONS.length}`} />
              <HeroStat label="累計回答" value={`${state.answers.length}`} />
            </div>
          </div>
        </div>
      </header>

      <Page>
        {resume && (
          <a href={href(`session/${resume.id}`)} className="block">
            <Card className="border-2 border-brand flex items-center gap-3 p-4">
              <PlayCircle className="w-7 h-7 text-brand shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold">続きから再開</p>
                <p className="text-xs text-muted truncate tnum">
                  {resume.title}　{resume.currentIndex + 1}/{resume.questionIds.length}問目
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted" />
            </Card>
          </a>
        )}

        <button onClick={() => start({ mode: "DAILY" }, "出題できる問題がありません。")} className="text-left rounded-lg bg-btn text-onBtn hover:bg-btnHover transition p-5 flex items-center gap-4">
          <CalendarCheck className="w-8 h-8 shrink-0" />
          <div className="flex-1">
            <p className="text-lg font-black">今日の{DAILY_COUNT}問</p>
            <p className="text-sm opacity-90">今日間違えた問題 → 3日以内 → 7日以内 → 未回答の順に出題</p>
          </div>
          <ChevronRight className="w-6 h-6" />
        </button>

        {message && (
          <p className="text-sm text-ng bg-ngSoft rounded-md px-4 py-3" role="alert">
            {message}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Menu href="mock" icon={<ClipboardList />} title="模試" desc="20 / 40 / 60問。本番と同じ1問1.75分の制限時間" />
          <Menu onClick={() => start({ mode: "WEAKNESS" }, "出題できる問題がありません。")} icon={<Target />} title="弱点克服" desc="初見正答率の低い分野から優先して出題" />
          <Menu
            onClick={() => start({ mode: "MISTAKES" }, "直近で間違えている問題はありません。")}
            icon={<RotateCcw />}
            title="間違い復習"
            desc={mistakes > 0 ? `直近で不正解の${mistakes}問（最大${MISTAKES_MAX}問）` : "直近で不正解の問題だけを反復"}
            badge={mistakes > 0 ? `${mistakes}` : undefined}
          />
          <Menu href="category" icon={<BookOpen />} title="分野別学習" desc="試験ガイドの8分野から選んで集中学習" />
          <Menu
            onClick={() => start({ mode: "BOOKMARKS" }, "ブックマークした問題はまだありません。問題画面の右上から追加できます。")}
            icon={<Bookmark />}
            title="ブックマーク"
            desc={state.bookmarks.length > 0 ? `${state.bookmarks.length}問を解き直す` : "気になる問題をあとで解き直す"}
          />
          <Menu href="questions" icon={<ListChecks />} title="問題一覧" desc="全問題の正誤状況と解説を確認" />
          <Menu href="dashboard" icon={<LayoutDashboard />} title="ダッシュボード" desc="分野別の初見正答率・消化率・解答スピード" />
          <Menu href="history" icon={<History />} title="学習履歴" desc="これまでのセッションと成績" />
        </div>

        <a href={href("settings")} className="self-center inline-flex items-center gap-1.5 text-sm text-muted hover:text-brandText py-2">
          <Settings className="w-4 h-4" />
          設定・バックアップ
        </a>
      </Page>
    </>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-btnHover px-2 py-2 min-w-0">
      <p className="text-[11px] opacity-80">{label}</p>
      <p className="text-lg font-black tnum leading-tight truncate">{value}</p>
    </div>
  );
}

function Menu({ href: to, onClick, icon, title, desc, badge }: { href?: string; onClick?: () => void; icon: React.ReactNode; title: string; desc: string; badge?: string }) {
  const body = (
    <Card className="flex items-center gap-4 p-4 h-full hover:bg-surface2 transition">
      <span className="text-brand shrink-0 [&>svg]:w-6 [&>svg]:h-6">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold flex items-center gap-2">
          {title}
          {badge && <span className="text-[11px] tnum font-bold px-1.5 rounded-full bg-ng text-surface">{badge}</span>}
        </p>
        <p className="text-xs text-muted">{desc}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted shrink-0" />
    </Card>
  );
  return to ? (
    <a href={href(to)} className="block">
      {body}
    </a>
  ) : (
    <button onClick={onClick} className={cn("block w-full text-left")}>
      {body}
    </button>
  );
}
