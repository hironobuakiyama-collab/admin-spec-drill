import { useRef, useState } from "react";
import { Copy, Download, Upload } from "lucide-react";
import { QUESTIONS } from "@/data/questions";
import { useStore } from "@/lib/store";
import { Button, Card, Page, PageHeader, SectionTitle } from "@/components/ui";

export function SettingsPage() {
  const { state, importBackup, resetAll } = useStore();
  const [notice, setNotice] = useState<{ tone: "ok" | "ng"; text: string } | null>(null);
  const [paste, setPaste] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const json = () => JSON.stringify(state);

  const download = () => {
    const blob = new Blob([json()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date();
    a.href = url;
    a.download = `admin-spec-drill-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice({ tone: "ok", text: "バックアップファイルを保存しました。" });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json());
      setNotice({ tone: "ok", text: "バックアップをクリップボードにコピーしました。メモアプリなどに貼り付けて保存できます。" });
    } catch {
      setPaste(json());
      setNotice({ tone: "ng", text: "コピーできなかったため、下の欄に表示しました。全選択してコピーしてください。" });
    }
  };

  const restore = (text: string) => {
    try {
      const r = importBackup(JSON.parse(text));
      setNotice({ tone: "ok", text: `取り込みました（回答 ${r.answers}件・セッション ${r.sessions}件を追加。重複分は除外）。` });
      setPaste("");
    } catch {
      setNotice({ tone: "ng", text: "読み込めませんでした。このアプリで作ったバックアップ（JSON）か確認してください。" });
    }
  };

  return (
    <>
      <PageHeader title="設定・バックアップ" />
      <Page>
        {notice && (
          <p className={notice.tone === "ok" ? "text-sm bg-okSoft text-ok rounded-md px-4 py-3" : "text-sm bg-ngSoft text-ng rounded-md px-4 py-3"} role="status">
            {notice.text}
          </p>
        )}

        <Card className="p-5 flex flex-col gap-3">
          <SectionTitle>学習記録のバックアップ</SectionTitle>
          <p className="text-sm text-muted">
            学習記録はこの端末のブラウザだけに保存されます（回答 {state.answers.length}件）。機種変更や、パソコンとスマホで記録を揃えたいときは、バックアップを書き出して別の端末で取り込んでください。取り込みは既存の記録に追加され、上書きはしません。
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" block onClick={download}>
              <Download className="w-4 h-4" />
              ファイルに保存
            </Button>
            <Button variant="outline" block onClick={copy}>
              <Copy className="w-4 h-4" />
              テキストでコピー
            </Button>
          </div>
          <div className="border-t border-line pt-3 flex flex-col gap-2">
            <input
              ref={fileRef}
              id="backup-file"
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) restore(await f.text());
                e.target.value = "";
              }}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4" />
              ファイルから取り込む
            </Button>
            <label htmlFor="backup-text" className="text-xs text-muted">
              またはテキストを貼り付けて取り込む
            </label>
            <textarea
              id="backup-text"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              rows={3}
              className="w-full rounded-md border-2 border-line bg-surface p-2 text-xs mono"
              placeholder='{"version":2,...}'
            />
            <Button disabled={!paste.trim()} onClick={() => restore(paste)}>
              貼り付けた内容を取り込む
            </Button>
          </div>
        </Card>

        <Card className="p-5 flex flex-col gap-3">
          <SectionTitle>記録のリセット</SectionTitle>
          {!confirmReset ? (
            <Button variant="outline" className="border-ng text-ng hover:bg-ngSoft" onClick={() => setConfirmReset(true)}>
              すべての学習記録を削除
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-ng font-bold">回答 {state.answers.length}件・ブックマーク {state.bookmarks.length}件を削除します。元に戻せません。</p>
              <div className="flex gap-2">
                <Button variant="outline" block onClick={() => setConfirmReset(false)}>
                  やめる
                </Button>
                <Button
                  variant="danger"
                  block
                  onClick={() => {
                    resetAll();
                    setConfirmReset(false);
                    setNotice({ tone: "ok", text: "学習記録を削除しました。" });
                  }}
                >
                  削除する
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5 flex flex-col gap-2 text-sm">
          <SectionTitle>このアプリについて</SectionTitle>
          <p>収録 {QUESTIONS.length}問。問題はすべて公開情報に基づくオリジナルで、実際の試験問題は含みません。</p>
          <p className="text-muted">
            出題範囲の配点・問題数・制限時間・合格ラインは、2025年12月改訂の試験ガイドに関する公開情報をもとにした目安です。受験前に Trailhead の公式試験ガイドで最新情報を確認してください。
          </p>
        </Card>
      </Page>
    </>
  );
}
