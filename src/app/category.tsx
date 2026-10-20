import { useMemo } from "react";
import { ChevronRight, ListChecks } from "lucide-react";
import { CATEGORIES } from "@/config/categories";
import { QUESTIONS } from "@/data/questions";
import { STUDY_COUNT, toAnalytics, useStore } from "@/lib/store";
import { href } from "@/lib/router";
import { categoryProgress } from "@/features/dashboard/domain/analytics";
import { Badge, Card, Page, PageHeader, ProgressBar } from "@/components/ui";
import { useStart } from "./home";

export function CategoryPage() {
  const { state } = useStore();
  const { start, message } = useStart();
  const progress = useMemo(() => categoryProgress(toAnalytics(state.answers), QUESTIONS), [state.answers]);

  return (
    <>
      <PageHeader title="分野別学習" sub="試験ガイドの出題分野" />
      <Page>
        <p className="text-sm text-muted">分野内で、復習が必要な問題・未回答の問題から順に最大{STUDY_COUNT}問を出題します。配点は試験ガイド（2025年12月改訂）の目安です。</p>
        {message && <p className="text-sm text-ng bg-ngSoft rounded-md px-4 py-3">{message}</p>}
        {CATEGORIES.map((c) => {
          const p = progress.find((x) => x.slug === c.slug);
          const pool = p?.poolSize ?? 0;
          const acc = p?.firstTry.accuracy ?? null;
          return (
            <Card key={c.slug} className="p-4 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold leading-snug">{c.name}</p>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <Badge tone="brand">配点 {c.weight}%</Badge>
                    <Badge>{pool}問</Badge>
                    {acc !== null && <Badge tone={acc >= 65 ? "ok" : "ng"}>初見 {acc}%</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-muted tnum">
                  <span>消化 {p?.covered ?? 0}/{pool}</span>
                  <span>今解ける {p?.masteredNow ?? 0}/{pool}</span>
                </div>
                <ProgressBar value={pool ? ((p?.masteredNow ?? 0) / pool) * 100 : 0} tone="ok" />
              </div>
              <div className="flex gap-2">
                <a href={href(`questions/${c.slug}`)} className="inline-flex items-center gap-1.5 rounded-md border-2 border-line px-3 py-2 text-sm font-bold text-muted hover:border-brand hover:text-brandText">
                  <ListChecks className="w-4 h-4" />
                  一覧
                </a>
                <button
                  disabled={pool === 0}
                  onClick={() => start({ mode: "CATEGORY", categorySlug: c.slug }, "この分野の問題はまだありません。")}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-btn text-onBtn hover:bg-btnHover px-3 py-2 text-sm font-bold disabled:bg-line disabled:text-muted"
                >
                  この分野を解く
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </Card>
          );
        })}
      </Page>
    </>
  );
}
