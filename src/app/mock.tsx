import { ChevronRight, Timer } from "lucide-react";
import { CATEGORIES } from "@/config/categories";
import { QUESTIONS } from "@/data/questions";
import { MOCK_PRESETS } from "@/lib/store";
import { apportion } from "@/features/quiz/domain/selection";
import { PASSING_RATE } from "@/features/quiz/domain/scoring";
import { Card, Page, PageHeader } from "@/components/ui";
import { useStart } from "./home";

export function MockPage() {
  const { start, message } = useStart();
  const caps = Object.fromEntries(CATEGORIES.map((c) => [c.slug, QUESTIONS.filter((q) => q.category === c.slug).length]));
  const weights = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.weight]));

  return (
    <>
      <PageHeader title="模試" sub="本番と同じ形式で実力チェック" />
      <Page>
        <Card className="p-4 text-sm text-fg flex flex-col gap-1.5">
          <p className="font-bold">本番の形式（目安）</p>
          <ul className="list-disc pl-5 text-muted flex flex-col gap-0.5">
            <li>60問・105分、合格ライン{PASSING_RATE}%</li>
            <li>単一選択と複数選択が混在し、複数選択は部分点なし</li>
            <li>解答中は正誤を表示せず、「見直し」フラグを付けて後から戻れる</li>
          </ul>
          <p className="text-xs text-muted">出題は配点に比例して分野を按分します。途中で閉じても、制限時間内なら続きから再開できます。</p>
        </Card>

        {message && <p className="text-sm text-ng bg-ngSoft rounded-md px-4 py-3">{message}</p>}

        {MOCK_PRESETS.map((p) => {
          const count = Math.min(p.count, QUESTIONS.length);
          const plan = apportion(count, weights, caps);
          const short = count < p.count;
          return (
            <button key={p.count} className="text-left" onClick={() => start({ mode: "MOCK", count: p.count, minutes: p.minutes }, "出題できる問題がありません。")}>
              <Card className="p-4 flex items-center gap-4 hover:bg-surface2 transition">
                <div className="w-14 h-14 rounded-md bg-brandSoft text-brandText flex flex-col items-center justify-center shrink-0">
                  <span className="text-xl font-black tnum leading-none">{count}</span>
                  <span className="text-[10px] font-bold">問</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{p.label}</p>
                  <p className="text-xs text-muted flex items-center gap-1 tnum">
                    <Timer className="w-3.5 h-3.5" />
                    {p.minutes}分
                    {short && `（問題数が足りないため${count}問）`}
                  </p>
                  <p className="text-[11px] text-muted mt-1 tnum">
                    {CATEGORIES.filter((c) => plan[c.slug] > 0)
                      .map((c) => `${c.short}${plan[c.slug]}`)
                      .join(" / ")}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted shrink-0" />
              </Card>
            </button>
          );
        })}
      </Page>
    </>
  );
}
