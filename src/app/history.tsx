import { ChevronRight } from "lucide-react";
import { getQuestion } from "@/data/questions";
import { useStore } from "@/lib/store";
import { href } from "@/lib/router";
import { isAllOrNothingCorrect, PASSING_RATE } from "@/features/quiz/domain/scoring";
import { Badge, Card, cn, Page, PageHeader } from "@/components/ui";
import { formatDateTime } from "./util";

export function HistoryPage() {
  const { state } = useStore();
  const sessions = state.sessions
    .filter((s) => s.finishedAt)
    .map((s) => {
      const isMock = s.mode === "MOCK";
      const scored = s.questionIds.filter((id) => isMock || s.responses[id]?.locked);
      const correct = scored.filter((id) => {
        const q = getQuestion(id);
        const sel = s.responses[id]?.selected ?? [];
        return q && sel.length > 0 && isAllOrNothingCorrect(q.answer, sel);
      }).length;
      return { s, total: scored.length, correct, rate: scored.length ? Math.round((correct / scored.length) * 100) : 0 };
    })
    .filter((x) => x.total > 0)
    .sort((a, b) => (a.s.startedAt < b.s.startedAt ? 1 : -1));

  return (
    <>
      <PageHeader title="学習履歴" sub={`${sessions.length}セッション`} />
      <Page>
        {sessions.length === 0 ? (
          <Card className="p-5">
            <p className="text-sm text-muted">終了したセッションはまだありません。</p>
          </Card>
        ) : (
          <Card>
            <ul>
              {sessions.map(({ s, total, correct, rate }, i) => (
                <li key={s.id} className={cn(i > 0 && "border-t border-line")}>
                  <a href={href(`result/${s.id}`)} className="flex items-center gap-3 px-4 py-3 hover:bg-surface2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{s.title}</p>
                      <p className="text-xs text-muted tnum">{formatDateTime(s.startedAt)}</p>
                    </div>
                    <span className="text-sm tnum">
                      {correct}/{total}
                    </span>
                    <Badge tone={rate >= PASSING_RATE ? "ok" : "ng"} className="w-12 justify-center tnum">
                      {rate}%
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted" />
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Page>
    </>
  );
}
