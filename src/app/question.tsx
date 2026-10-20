import { getQuestion } from "@/data/questions";
import { useStore } from "@/lib/store";
import { historyOf } from "@/features/history/domain/records";
import { Explanation, Options, QuestionHeader } from "@/features/quiz/components/question-view";
import { Badge, Card, Page, PageHeader, SectionTitle } from "@/components/ui";
import { formatDateTime } from "./util";

/** 1問の解説と自分の回答履歴を見る画面（結果画面・問題一覧から開く） */
export function QuestionPage({ id }: { id: string }) {
  const { state, toggleBookmark } = useStore();
  const q = getQuestion(id);

  if (!q) {
    return (
      <>
        <PageHeader title="問題" back="questions" />
        <Page>
          <p className="text-sm text-muted">この問題は見つかりませんでした。</p>
        </Page>
      </>
    );
  }

  const history = historyOf(q.id, state.answers);
  const last = history[0]?.selected ?? [];

  return (
    <>
      <PageHeader title="解説" sub={q.id} back={`questions/${q.category}`} />
      <Page>
        <QuestionHeader q={q} bookmarked={state.bookmarks.includes(q.id)} onBookmark={() => toggleBookmark(q.id)} />
        <p className="text-xs text-muted">引っかけポイント：{q.trap}</p>
        <h2 className="text-base sm:text-lg font-bold leading-relaxed">{q.stem}</h2>
        <Options q={q} selected={last} revealed />
        <Card className="p-4 flex flex-col gap-2">
          <SectionTitle>あなたの回答履歴</SectionTitle>
          {history.length === 0 ? (
            <p className="text-sm text-muted">まだ解いていません。</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {history.slice(0, 8).map((h) => (
                <li key={`${h.answeredAt}-${h.sessionId}`} className="flex items-center gap-3 text-sm tnum">
                  <Badge tone={h.isCorrect ? "ok" : "ng"}>{h.isCorrect ? "正解" : "不正解"}</Badge>
                  <span className="mono text-xs">{h.selected.join(",")}</span>
                  <span className="text-xs text-muted ml-auto">{formatDateTime(h.answeredAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Explanation q={q} selected={last} />
      </Page>
    </>
  );
}
