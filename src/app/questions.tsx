import { useMemo } from "react";
import { Bookmark, ChevronRight } from "lucide-react";
import { CATEGORIES, getCategory } from "@/config/categories";
import { QUESTIONS } from "@/data/questions";
import { useStore } from "@/lib/store";
import { href } from "@/lib/router";
import { buildQuestionStates } from "@/features/history/domain/records";
import { DIFFICULTY_LABEL } from "@/features/quiz/components/question-view";
import { Badge, Card, cn, Page, PageHeader } from "@/components/ui";

export function QuestionsPage({ slug }: { slug?: string }) {
  const { state } = useStore();
  const category = slug ? getCategory(slug) : undefined;
  const list = category ? QUESTIONS.filter((q) => q.category === category.slug) : QUESTIONS;
  const states = useMemo(() => new Map(buildQuestionStates(list.map((q) => q.id), state.answers).map((s) => [s.questionId, s])), [list, state.answers]);

  return (
    <>
      <PageHeader title={category ? category.short : "問題一覧"} sub={category ? "問題一覧" : `全${QUESTIONS.length}問`} back={category ? "category" : ""} />
      <Page>
        <nav className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1" aria-label="分野で絞り込み">
          <Chip to="questions" active={!category}>
            すべて
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c.slug} to={`questions/${c.slug}`} active={category?.slug === c.slug}>
              {c.short}
            </Chip>
          ))}
        </nav>
        <Card>
          <ul>
            {list.map((q, i) => {
              const s = states.get(q.id);
              const status = s?.lastResult == null ? "未回答" : s.lastResult ? "正解" : "不正解";
              return (
                <li key={q.id} className={cn(i > 0 && "border-t border-line")}>
                  <a href={href(`question/${q.id}`)} className="flex items-start gap-3 px-4 py-3 hover:bg-surface2">
                    <Badge tone={s?.lastResult == null ? "muted" : s.lastResult ? "ok" : "ng"} className="shrink-0 w-14 justify-center mt-0.5">
                      {status}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{q.stem}</p>
                      <p className="text-[11px] text-muted mt-0.5 flex items-center gap-2">
                        <span className="mono">{q.id}</span>
                        <span>{DIFFICULTY_LABEL[q.difficulty]}</span>
                        {q.pick > 1 && <span className="text-brandText font-bold">{q.pick}つ選択</span>}
                        {state.bookmarks.includes(q.id) && <Bookmark className="w-3 h-3 text-brand" aria-label="ブックマーク済み" />}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted shrink-0 mt-1" />
                  </a>
                </li>
              );
            })}
          </ul>
        </Card>
      </Page>
    </>
  );
}

function Chip({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href(to)}
      className={cn("shrink-0 text-sm font-bold px-3 py-1.5 rounded-full border-2", active ? "bg-brand border-brand text-onBtn" : "border-line text-muted bg-surface hover:border-brand")}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </a>
  );
}
