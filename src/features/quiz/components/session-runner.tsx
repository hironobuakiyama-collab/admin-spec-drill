import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Flag, Grid3x3, Timer, X } from "lucide-react";
import type { Session } from "@/features/history/domain/records";
import { getQuestion } from "@/data/questions";
import { useStore } from "@/lib/store";
import { navigate } from "@/lib/router";
import { Button, cn, ProgressBar } from "@/components/ui";
import { Explanation, Options, QuestionHeader, Verdict } from "./question-view";

function formatRemaining(sec: number): string {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

export function SessionRunner({ session }: { session: Session }) {
  const isMock = session.mode === "MOCK";
  const store = useStore();
  const { submitAnswer, setDraft, setIndex, toggleFlag, finishSession, toggleBookmark } = store;
  const index = session.currentIndex;
  const qid = session.questionIds[index];
  const q = getQuestion(qid);
  const response = session.responses[qid];
  const locked = !!response?.locked;

  const [draft, setDraftState] = useState<string[]>(response?.selected ?? []);
  const [showPalette, setShowPalette] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const since = useRef(Date.now());

  useEffect(() => {
    setDraftState(session.responses[qid]?.selected ?? []);
    since.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qid]);

  const elapsedSinceMark = () => {
    const now = Date.now();
    const d = now - since.current;
    since.current = now;
    return d;
  };

  const finish = useCallback(() => {
    finishSession(session.id);
    navigate(`result/${session.id}`, { replace: true });
  }, [finishSession, session.id]);

  const deadlineMs = session.deadline ? Date.parse(session.deadline) : null;
  const [remaining, setRemaining] = useState<number | null>(deadlineMs === null ? null : Math.ceil((deadlineMs - Date.now()) / 1000));
  const timedOut = useRef(false);
  useEffect(() => {
    if (deadlineMs === null) return;
    const tick = () => {
      const left = Math.ceil((deadlineMs - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0 && !timedOut.current) {
        timedOut.current = true;
        finish();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineMs, finish]);

  const toggle = useCallback(
    (key: string) => {
      if (!q || locked) return;
      let next: string[];
      if (q.pick === 1) next = [key];
      else if (draft.includes(key)) next = draft.filter((k) => k !== key);
      else if (isMock && draft.length >= q.pick) return;
      else next = [...draft, key].sort();
      setDraftState(next);
      if (isMock) setDraft(session.id, qid, next, elapsedSinceMark());
    },
    [q, locked, draft, isMock, setDraft, session.id, qid],
  );

  const ready = !!q && draft.length === q.pick;
  const isLast = index === session.questionIds.length - 1;

  const submit = useCallback(() => {
    if (!q || locked || draft.length !== q.pick) return;
    submitAnswer(session.id, qid, draft, Date.now() - since.current);
  }, [q, locked, draft, submitAnswer, session.id, qid]);

  const go = useCallback(
    (to: number) => {
      if (isMock) setDraft(session.id, qid, draft, elapsedSinceMark());
      setIndex(session.id, to);
      setShowPalette(false);
      window.scrollTo(0, 0);
    },
    [isMock, setDraft, session.id, qid, draft, setIndex],
  );

  const next = useCallback(() => {
    if (isLast) {
      if (isMock) setConfirmFinish(true);
      else finish();
    } else go(index + 1);
  }, [isLast, isMock, finish, go, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || !q || confirmFinish) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const n = parseInt(e.key, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= q.options.length) {
        e.preventDefault();
        toggle(q.options[n - 1].key);
      } else if (e.key === "Enter") {
        if (t && t.tagName === "BUTTON" && !t.id.startsWith("opt-")) return;
        e.preventDefault();
        if (isMock || locked) next();
        else submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, toggle, submit, next, locked, isMock, confirmFinish]);

  if (!q) return null;

  const answeredCount = session.questionIds.filter((id) => (session.responses[id]?.selected.length ?? 0) > 0 || (id === qid && draft.length > 0)).length;
  const flagged = session.flagged.includes(qid);
  const progress = isMock ? (answeredCount / session.questionIds.length) * 100 : ((index + (locked ? 1 : 0)) / session.questionIds.length) * 100;
  const unanswered = session.questionIds.length - answeredCount;

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-band text-onBand sticky top-0 z-20">
        <div className="gutter">
          <div className="max-w-2xl mx-auto py-2.5 flex items-center gap-3">
            <button
              onClick={() => {
                if (isMock) setDraft(session.id, qid, draft, elapsedSinceMark());
                navigate("");
              }}
              className="-ml-2 p-2 rounded-md hover:bg-btnHover"
              aria-label="中断してホームへ（続きから再開できます）"
              title="中断（続きから再開できます）"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] opacity-80 truncate">{session.title}</p>
              <p className="text-sm font-bold tnum">
                {index + 1} / {session.questionIds.length} 問
              </p>
            </div>
            {remaining !== null && (
              <span className={cn("flex items-center gap-1 mono font-semibold tnum text-sm px-2 py-1 rounded", remaining <= 300 ? "bg-ng text-surface" : "bg-btnHover")}>
                <Timer className="w-4 h-4" />
                {formatRemaining(remaining)}
              </span>
            )}
            {isMock && (
              <button onClick={() => setShowPalette((v) => !v)} className="p-2 -mr-2 rounded-md hover:bg-btnHover" aria-expanded={showPalette} aria-label="問題一覧">
                <Grid3x3 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <ProgressBar value={progress} />
      </header>

      {isMock && showPalette && (
        <div className="gutter bg-surface border-b border-line">
          <div className="max-w-2xl mx-auto py-4 flex flex-col gap-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <span>回答済み {answeredCount}</span>
              <span>未回答 {unanswered}</span>
              <span>見直し {session.flagged.length}</span>
            </div>
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
              {session.questionIds.map((id, i) => {
                const done = (session.responses[id]?.selected.length ?? 0) > 0 || (id === qid && draft.length > 0);
                const fl = session.flagged.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => go(i)}
                    className={cn(
                      "relative mono tnum text-xs py-2 rounded border-2",
                      i === index ? "border-brand" : "border-transparent",
                      done ? "bg-brandSoft text-brandText font-semibold" : "bg-surface2 text-muted",
                    )}
                    aria-label={`${i + 1}問目${done ? " 回答済み" : " 未回答"}${fl ? " 見直し" : ""}`}
                  >
                    {i + 1}
                    {fl && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-warn" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main className="gutter flex-1">
        <div className="max-w-2xl mx-auto py-5 flex flex-col gap-4">
          <QuestionHeader q={q} bookmarked={store.state.bookmarks.includes(q.id)} onBookmark={() => toggleBookmark(q.id)} />
          {!isMock && <p className="text-xs text-muted">引っかけポイント：{q.trap}</p>}
          <h2 className="text-base sm:text-lg font-bold leading-relaxed text-fg">{q.stem}</h2>
          <Options q={q} selected={draft} revealed={!isMock && locked} onToggle={toggle} />
          {!isMock && locked && (
            <>
              <Verdict q={q} selected={response.selected} />
              <Explanation q={q} selected={response.selected} />
            </>
          )}
        </div>
      </main>

      <div className="sticky bottom-0 z-10 border-t border-line bg-surface2 gutter pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="max-w-2xl mx-auto flex flex-col gap-2">
          {isMock ? (
            <>
              <p className="text-xs text-muted tnum" aria-live="polite">
                {q.pick > 1 ? `${q.pick}つ選択（${draft.length}/${q.pick}）` : draft.length ? "選択済み" : "1つ選択"}
                {q.pick > 1 && draft.length > 0 && draft.length < q.pick ? `　あと${q.pick - draft.length}つ` : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="px-3" onClick={() => go(index - 1)} disabled={index === 0} aria-label="前の問題">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button variant={flagged ? "primary" : "outline"} className={cn("px-3", flagged && "bg-warn hover:bg-warn")} onClick={() => toggleFlag(session.id, qid)} aria-pressed={flagged}>
                  <Flag className="w-4 h-4" />
                  <span className="text-sm">見直し</span>
                </Button>
                <Button className="flex-1" onClick={next}>
                  {isLast ? "見直して終了" : "次へ"}
                  {!isLast && <ChevronRight className="w-5 h-5" />}
                </Button>
              </div>
            </>
          ) : !locked ? (
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted flex-1 tnum" aria-live="polite">
                {q.pick > 1
                  ? ready
                    ? `選択数OK（${draft.length}/${q.pick}）`
                    : draft.length < q.pick
                      ? `あと${q.pick - draft.length}つ選択（${draft.length}/${q.pick}）`
                      : `${draft.length - q.pick}つ外してください（${draft.length}/${q.pick}）`
                  : ready
                    ? "確定できます"
                    : "1つ選択してください"}
              </p>
              <Button id="submit" onClick={submit} disabled={!ready}>
                回答を確定
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {index > 0 && (
                <Button variant="outline" className="px-3" onClick={() => go(index - 1)} aria-label="前の問題">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}
              <Button id="next" block onClick={next}>
                {isLast ? "結果を見る" : "次の問題へ"}
                {!isLast && <ChevronRight className="w-5 h-5" />}
              </Button>
            </div>
          )}
        </div>
      </div>

      {confirmFinish && (
        <div className="fixed inset-0 z-30 bg-[rgba(3,20,40,0.55)] flex items-end sm:items-center justify-center gutter pb-[max(1rem,env(safe-area-inset-bottom))]" role="dialog" aria-modal="true" aria-labelledby="finish-title">
          <div className="bg-surface rounded-lg border border-line w-full max-w-md p-5 flex flex-col gap-4 fade-in">
            <h2 id="finish-title" className="text-lg font-bold">
              模試を終了しますか
            </h2>
            <ul className="text-sm text-fg flex flex-col gap-1 tnum">
              <li>回答済み：{answeredCount}問</li>
              <li className={unanswered > 0 ? "text-ng font-bold" : ""}>未回答：{unanswered}問（不正解として採点）</li>
              <li className={session.flagged.length > 0 ? "text-warn font-bold" : ""}>見直しフラグ：{session.flagged.length}問</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" block onClick={() => { setConfirmFinish(false); setShowPalette(true); }}>
                問題一覧で見直す
              </Button>
              <Button block onClick={() => { setDraft(session.id, qid, draft, elapsedSinceMark()); finish(); }}>
                終了して採点
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
