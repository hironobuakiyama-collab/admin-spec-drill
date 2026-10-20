import { Bookmark, BookmarkCheck } from "lucide-react";
import type { Question } from "@/data/types";
import { getCategory } from "@/config/categories";
import { Badge, cn, SectionTitle } from "@/components/ui";
import { countHits, isAllOrNothingCorrect } from "../domain/scoring";

export const DIFFICULTY_LABEL = { BEGINNER: "初級", INTERMEDIATE: "中級", ADVANCED: "上級" } as const;
const DIFFICULTY_TONE = { BEGINNER: "muted", INTERMEDIATE: "brand", ADVANCED: "warn" } as const;

type OptionState = "idle" | "selected" | "hit" | "wrong" | "missed" | "neutral";

const OPTION_STYLE: Record<OptionState, string> = {
  idle: "border-line bg-surface hover:border-brand hover:bg-surface2",
  selected: "border-brand bg-brandSoft",
  hit: "border-ok bg-okSoft",
  wrong: "border-ng bg-ngSoft",
  missed: "border-ok border-dashed bg-surface",
  neutral: "border-line bg-surface opacity-70",
};

const OPTION_LABEL: Partial<Record<OptionState, { text: string; cls: string }>> = {
  hit: { text: "正解", cls: "bg-ok text-surface" },
  wrong: { text: "誤り", cls: "bg-ng text-surface" },
  missed: { text: "選択漏れ", cls: "border border-ok text-ok" },
};

export function QuestionHeader({ q, bookmarked, onBookmark }: { q: Question; bookmarked?: boolean; onBookmark?: () => void }) {
  const multi = q.pick > 1;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>{getCategory(q.category)?.short}</Badge>
      <Badge tone={DIFFICULTY_TONE[q.difficulty]}>{DIFFICULTY_LABEL[q.difficulty]}</Badge>
      <span className={cn("text-xs font-bold px-2 py-0.5 rounded", multi ? "bg-brand text-onBtn" : "bg-brandSoft text-brandText")}>
        {multi ? `${q.pick}つ選択・部分点なし` : "1つ選択"}
      </span>
      {onBookmark && (
        <button
          onClick={onBookmark}
          className={cn("ml-auto p-1.5 -m-1.5 rounded", bookmarked ? "text-brand" : "text-muted hover:text-brandText")}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? "ブックマークを外す" : "ブックマークする"}
        >
          {bookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
}

export function Options({
  q,
  selected,
  revealed,
  disabled,
  onToggle,
}: {
  q: Question;
  selected: string[];
  revealed: boolean;
  disabled?: boolean;
  onToggle?: (key: string) => void;
}) {
  const multi = q.pick > 1;
  return (
    <div className="flex flex-col gap-3" role={multi ? "group" : "radiogroup"} aria-label="選択肢">
      {q.options.map((opt) => {
        const isSel = selected.includes(opt.key);
        const isAns = q.answer.includes(opt.key);
        let state: OptionState = isSel ? "selected" : "idle";
        if (revealed) state = isSel && isAns ? "hit" : isSel ? "wrong" : isAns ? "missed" : "neutral";
        const markOn = state === "selected" || state === "hit" || state === "wrong";
        const markColor = state === "wrong" ? "bg-ng border-ng" : state === "hit" ? "bg-ok border-ok" : "bg-brand border-brand";
        const label = OPTION_LABEL[state];
        const locked = revealed || disabled;
        return (
          <button
            key={opt.key}
            id={`opt-${q.id}-${opt.key}`}
            role={multi ? "checkbox" : "radio"}
            aria-checked={isSel}
            disabled={locked}
            onClick={() => onToggle?.(opt.key)}
            className={cn(
              "w-full text-left flex gap-3 items-start p-4 rounded-md border-2 transition active:scale-[0.99]",
              OPTION_STYLE[state],
              locked ? "cursor-default active:scale-100" : "cursor-pointer",
            )}
          >
            <span
              className={cn("mt-1 w-5 h-5 shrink-0 border-2 flex items-center justify-center", multi ? "rounded" : "rounded-full", markOn ? markColor : "border-muted")}
              aria-hidden="true"
            >
              {markOn &&
                (multi ? (
                  <svg viewBox="0 0 16 16" className="w-3 h-3">
                    <path d="M3 8.5l3 3 7-7" fill="none" stroke="var(--surface)" strokeWidth="2.5" />
                  </svg>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-surface" />
                ))}
            </span>
            <span className="flex-1 min-w-0">
              <span className="flex flex-wrap items-center gap-2 mb-1">
                <span className="mono text-sm font-semibold text-brandText">{opt.key}</span>
                {label && <span className={cn("text-xs font-bold px-2 py-0.5 rounded", label.cls)}>{label.text}</span>}
              </span>
              <span className="block text-fg">{opt.text}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Verdict({ q, selected }: { q: Question; selected: string[] }) {
  const ok = isAllOrNothingCorrect(q.answer, selected);
  const multi = q.pick > 1;
  const hits = countHits(q.answer, selected);
  return (
    <div className={cn("fade-in rounded-md px-4 py-3 border-2", ok ? "border-ok bg-okSoft" : "border-ng bg-ngSoft")} role="status">
      <p className={cn("text-lg font-black", ok ? "text-ok" : "text-ng")}>{ok ? "正解" : selected.length === 0 ? "未回答" : "不正解"}</p>
      <p className="text-sm text-fg">
        {ok
          ? "すべての正解を過不足なく選択できています。"
          : multi
            ? `正解は ${q.answer.join("・")}。${q.pick}つ中 ${hits}つ一致していますが、部分点はないため0点です。`
            : `正解は ${q.answer[0]}。`}
      </p>
    </div>
  );
}

export function Explanation({ q, selected }: { q: Question; selected: string[] }) {
  const ex = q.explanation;
  return (
    <div className="fade-in flex flex-col gap-6 pt-2">
      <section className="flex flex-col gap-2">
        <SectionTitle>要点</SectionTitle>
        <p className="text-fg font-medium">{ex.summary}</p>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>選択肢ごとの解説</SectionTitle>
        <ul className="flex flex-col gap-3">
          {q.options.map((o) => {
            const ans = q.answer.includes(o.key);
            const picked = selected.includes(o.key);
            return (
              <li key={o.key} className="flex gap-3">
                <span className={cn("mono text-sm font-semibold w-8 h-8 shrink-0 rounded flex items-center justify-center", ans ? "bg-okSoft text-ok" : "bg-surface2 text-muted")}>
                  {o.key}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold mb-0.5">
                    <span className={ans ? "text-ok" : "text-muted"}>{ans ? "正しい" : "誤り"}</span>
                    {picked && <span className="text-brandText">　あなたが選択</span>}
                  </p>
                  <p className="text-sm text-fg">{ex.perOption[o.key]}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {ex.order && (
        <section className="flex flex-col gap-3">
          <SectionTitle>処理の順序</SectionTitle>
          <ol className="flex flex-wrap gap-2">
            {ex.order.map((s, i) => {
              const hl = s.includes("フロー") || s.includes("非同期") || s === "コミット";
              return (
                <li key={s} className={cn("text-xs px-2 py-1 rounded border tnum", hl ? "border-brand bg-brandSoft text-brandText font-bold" : "border-line bg-surface2 text-muted")}>
                  <span className="mono mr-1">{i + 1}</span>
                  {s}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionTitle>一般IT用語との対比</SectionTitle>
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-surface2">
              <tr>
                <th className="text-left font-bold text-muted px-3 py-2 w-1/2">一般的なIT / AWS / RDB</th>
                <th className="text-left font-bold text-muted px-3 py-2 w-1/2">Salesforce</th>
              </tr>
            </thead>
            <tbody>
              {ex.analogy.map((a, i) => (
                <tr key={i} className="border-t border-line align-top">
                  <td className="px-3 py-2 text-fg">{a.it}</td>
                  <td className="px-3 py-2 text-fg font-medium">{a.sf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>なぜSalesforceはこの仕様なのか</SectionTitle>
        <div className="flex flex-col gap-3 max-w-[65ch]">
          {ex.background.map((p, i) => (
            <p key={i} className="text-sm text-fg">
              {p}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-md bg-warnSoft px-4 py-3">
        <p className="text-xs font-bold eyebrow text-warn mb-1">本番での見分け方</p>
        <p className="text-sm text-fg">{ex.tip}</p>
      </section>
    </div>
  );
}
