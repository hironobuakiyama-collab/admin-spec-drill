import { CheckCircle2, ChevronRight, RotateCcw, XCircle } from "lucide-react";
import { getQuestion } from "@/data/questions";
import { getCategoryName } from "@/config/categories";
import { useStore } from "@/lib/store";
import { href, navigate } from "@/lib/router";
import { isAllOrNothingCorrect, PASSING_RATE, scoreSession } from "@/features/quiz/domain/scoring";
import { medianOf } from "./util";
import { Badge, Button, Card, cn, Page, PageHeader, ProgressBar, SectionTitle, Stat } from "@/components/ui";
import { useStart } from "./home";

export function ResultPage({ id }: { id: string }) {
  const { state } = useStore();
  const { start } = useStart();
  const session = state.sessions.find((s) => s.id === id);

  if (!session) {
    return (
      <>
        <PageHeader title="結果" />
        <Page>
          <p className="text-sm text-muted">このセッションは見つかりませんでした。</p>
        </Page>
      </>
    );
  }

  const isMock = session.mode === "MOCK";
  const rows = session.questionIds.flatMap((qid) => {
    const q = getQuestion(qid);
    const r = session.responses[qid];
    if (!q) return [];
    if (!isMock && !r?.locked) return [];
    const selected = r?.selected ?? [];
    return [{ q, selected, isCorrect: selected.length > 0 && isAllOrNothingCorrect(q.answer, selected), elapsedMs: r?.elapsedMs ?? 0 }];
  });
  const result = scoreSession(rows.map((r) => ({ categorySlug: r.q.category, categoryName: getCategoryName(r.q.category), isCorrect: r.isCorrect })));
  const multi = rows.filter((r) => r.q.pick > 1);
  const multiCorrect = multi.filter((r) => r.isCorrect).length;
  const medianSec = medianOf(rows.map((r) => r.elapsedMs / 1000).filter((s) => s > 0));
  const wrongCount = rows.filter((r) => !r.isCorrect).length;

  return (
    <>
      <PageHeader title="結果" sub={session.title} />
      <Page>
        <Card className="p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-x-5 gap-y-1">
            <p className="text-5xl font-black tnum">
              {result.correct}
              <span className="text-2xl text-muted"> / {result.total}</span>
            </p>
            <p className={cn("text-2xl font-black tnum", result.passed ? "text-ok" : "text-ng")}>{result.accuracy}%</p>
            {isMock && <Badge tone={result.passed ? "ok" : "ng"} className="text-sm">{result.passed ? "合格ライン到達" : "合格ライン未達"}</Badge>}
          </div>
          <div className="flex flex-col gap-1">
            <ProgressBar value={result.accuracy} tone={result.passed ? "ok" : "ng"} marker={PASSING_RATE} />
            <p className="text-[11px] text-muted">縦線は合格ラインの目安（{PASSING_RATE}%）</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="複数選択の完答" value={multi.length ? `${multiCorrect}/${multi.length}` : "-"} note="部分点なし" />
            <Stat label="1問あたり（中央値）" value={medianSec ?? "-"} unit={medianSec !== null ? "秒" : undefined} note="本番の持ち時間は105秒" />
          </div>
        </Card>

        {result.byCategory.length > 1 && (
          <Card className="p-5 flex flex-col gap-3">
            <SectionTitle>分野別</SectionTitle>
            {result.byCategory.map((c) => (
              <div key={c.slug} className="flex flex-col gap-1">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">{c.name}</span>
                  <span className="tnum font-bold shrink-0">
                    {c.correct}/{c.total}
                    <span className={cn("ml-2", (c.accuracy ?? 0) >= PASSING_RATE ? "text-ok" : "text-ng")}>{c.accuracy}%</span>
                  </span>
                </div>
                <ProgressBar value={c.accuracy ?? 0} tone={(c.accuracy ?? 0) >= PASSING_RATE ? "ok" : "ng"} marker={PASSING_RATE} />
              </div>
            ))}
          </Card>
        )}

        <Card className="p-5 flex flex-col gap-2">
          <SectionTitle>次にやること</SectionTitle>
          {result.recommendations.map((r) => (
            <p key={r} className="text-sm">
              {r}
            </p>
          ))}
        </Card>

        <Card>
          <div className="px-5 pt-5 pb-2">
            <SectionTitle>問題ごとの結果</SectionTitle>
          </div>
          <ul>
            {rows.map((r, i) => (
              <li key={r.q.id} className="border-t border-line">
                <a href={href(`question/${r.q.id}`)} className="flex items-start gap-3 px-5 py-3 hover:bg-surface2">
                  {r.isCorrect ? <CheckCircle2 className="w-5 h-5 text-ok shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-ng shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">
                      <span className="mono text-xs text-muted mr-1.5 tnum">{i + 1}.</span>
                      {r.q.stem}
                    </p>
                    <p className="text-xs text-muted mt-0.5 mono tnum">
                      選択 {r.selected.join(",") || "未回答"} / 正解 {r.q.answer.join(",")}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted shrink-0 mt-1" />
                </a>
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex flex-col sm:flex-row gap-2">
          {wrongCount > 0 && (
            <Button block onClick={() => start({ mode: "MISTAKES" }, "")}>
              <RotateCcw className="w-4 h-4" />
              間違えた問題を復習
            </Button>
          )}
          <Button variant="outline" block onClick={() => navigate("")}>
            ホームへ
          </Button>
        </div>
      </Page>
    </>
  );
}
