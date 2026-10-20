
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";

const QUESTIONS = [
  {
    id: "q1",
    domain: "セキュリティ / レコード共有",
    trap: "共有ルールで「制限」できると思い込む",
    pick: 1,
    stem: "ある企業では商談（Opportunity）の組織の共有設定（OWD）を「非公開（Private）」にしている。東日本営業チームのメンバー同士で、互いが所有する商談を「参照のみ」で閲覧できるようにしたい。ただし、他地域の営業担当者が所有する商談は見せたくない。最も適切な対応はどれか。",
    options: [
      { key: "A", text: "商談のOWDを「公開/参照のみ」に変更し、共有ルールで他地域の商談へのアクセスを制限する。" },
      { key: "B", text: "東日本営業チームの公開グループを作成し、所有者ベースの共有ルールで「同グループのメンバーが所有する商談」を同グループへ「参照のみ」で共有する。" },
      { key: "C", text: "東日本営業チームのプロファイルで、商談オブジェクトの「すべて表示」権限を有効にする。" },
      { key: "D", text: "ロール階層の「階層を使用したアクセス許可」を無効化し、同じロールのユーザ同士でレコードが共有されるようにする。" }
    ],
    answer: ["B"],
    explanation: {
      summary: "共有ルールはOWDで決めたベースラインからアクセスを「広げる」ための仕組みで、狭める方向には働かない。OWDを最も厳しい「非公開」に保ち、必要な範囲だけ共有ルールで開けるのが正しい設計手順になる。",
      perOption: {
        A: "OWDを「公開/参照のみ」にした時点で全ユーザが全商談を参照できる。共有ルールは付与専用なので、そこから他地域だけを閉じる手段はない。",
        B: "OWD＝非公開で最小化し、公開グループ＋所有者ベースの共有ルールで必要な範囲だけを開ける。地域を項目で持っている場合は、条件ベースの共有ルール（例：Region__c = '東日本'）でもよい。",
        C: "「すべて表示」はオブジェクト権限で、共有設定を無視してそのオブジェクトの全レコードを参照可能にする。他地域の商談も見えてしまう。",
        D: "標準オブジェクトでは「階層を使用したアクセス許可」を無効化できない。そもそもロール階層は上位ロールが下位ロールのデータを見る仕組みで、同じロールの同僚同士では共有されない。"
      },
      analogy: [
        { it: "AWS セキュリティグループ（許可ルールのみ。Denyルールは書けない）", sf: "共有ルール（アクセスの付与のみ）" },
        { it: "暗黙のデフォルト拒否", sf: "OWD＝非公開" },
        { it: "PostgreSQL RLS の PERMISSIVE ポリシー（複数ポリシーを OR で結合）", sf: "所有者・ロール階層・共有ルール・手動共有・チームの和集合" },
        { it: "ネットワーク ACL の Deny ルール", sf: "共有ルールには存在しない" }
      ],
      background: [
        "Salesforceのレコードアクセスは、所有者、ロール階層、共有ルール、手動共有、チームなど複数の経路から与えられたアクセス権の和集合（OR）で決まる。内部では各オブジェクトに共有テーブル（例：OpportunityShare）があり、「誰に・どのレベルで」アクセスを与えるかが行として保存される。",
        "評価ルールは「1行でも許可があればアクセス可」で、拒否を表す行がない。Deny と Allow の優先順位を解決する処理が不要になるので、マルチテナント環境で大量レコードの可視性を高速に判定できる。",
        "この設計から、OWDで最も厳しいベースラインを決め、例外を足していく手順だけが正しいやり方になる。なお一部オブジェクトには可視性を絞る「制限ルール」があるが、共有ルールの問題では「共有ルールでは制限できない」と覚えておけばよい。"
      ],
      tip: "共有ルール、ロール階層、手動共有はすべて「開ける」側。「閉じる」のはOWDだけ。選択肢に「共有ルールで制限する」とあれば、その時点で除外してよい。"
    }
  },
  {
    id: "q2",
    domain: "データモデル / リレーション",
    trap: "主従と参照をRDBのFKとして同一視する",
    pick: 2,
    stem: "主従関係（Master-Detail）と参照関係（Lookup）の違いについて、正しい説明はどれか。2つ選択せよ。",
    options: [
      { key: "A", text: "主従関係では、主レコードを削除すると関連する従レコードも削除される。" },
      { key: "B", text: "積み上げ集計項目は主従関係の主オブジェクト側に作成できるが、カスタムの参照関係しかない場合は作成できない。" },
      { key: "C", text: "参照関係では、子レコードの所有者が親レコードの所有者に自動的に揃えられる。" },
      { key: "D", text: "主従関係の従オブジェクトは、主オブジェクトとは別に独自の組織の共有設定（OWD）を設定できる。" },
      { key: "E", text: "1つのカスタムオブジェクトには、主従関係を最大5つまで作成できる。" }
    ],
    answer: ["A", "B"],
    explanation: {
      summary: "主従関係は「子は親なしでは存在できない」強い結合（コンポジション）。削除、所有者、共有、集計がすべて親に従属する。参照関係は子が独立して存在する緩い結合で、これらの連動は起きない。",
      perOption: {
        A: "主レコードを削除すると従レコードもカスケード削除される。主レコードをごみ箱から復元すると、従レコードも一緒に復元される。",
        B: "積み上げ集計（COUNT / SUM / MIN / MAX）は主従関係の主側にのみ作成できる。取引先と商談など一部の標準リレーションは例外的に対応しているが、カスタムの参照関係では作れない。",
        C: "所有者が親に揃うのは主従関係の方。従レコードには所有者項目がなく、主レコードの所有者がそのまま有効になる。参照関係の子レコードは独立した所有者を持つ。",
        D: "従オブジェクトのOWDは「親レコードに連動（Controlled by Parent）」で固定される。アクセス権は主レコードから継承され、個別には設定できない。",
        E: "主従関係は1オブジェクトにつき最大2つ（参照関係は最大40）。主従を2つ持つオブジェクトは連結オブジェクトとなり、多対多を表現する。"
      },
      analogy: [
        { it: "FOREIGN KEY ... NOT NULL ON DELETE CASCADE", sf: "主従関係（親参照は必須、削除は連鎖）" },
        { it: "NULL許容 FK ... ON DELETE SET NULL", sf: "参照関係の既定の削除動作「この項目の値をクリア」" },
        { it: "ON DELETE RESTRICT", sf: "参照関係の「参照レコードの削除を許可しない」" },
        { it: "トリガーで同期維持する集計列（マテリアライズドな集計）", sf: "積み上げ集計項目" },
        { it: "多対多を解消する中間テーブル", sf: "主従関係を2つ持つ連結オブジェクト" }
      ],
      background: [
        "RDBのFKは参照整合性の制約にすぎないが、Salesforceの主従関係は所有権、共有、ライフサイクルまで親子で一体化させる。子レコードの可視性は常に親と同じになるため、子のDML時にプラットフォームが同じトランザクション内で親の集計値を安全に再計算できる。",
        "参照関係では子が独自の所有者と共有設定を持つ。親から見えない子が集計に混ざる、親を失った子が残るといった状態を避けられないので、標準の積み上げ集計は提供されていない。参照関係で集計したい場合はフローやApexで実装する。",
        "既存データのある参照関係を主従関係に変換するには、全子レコードの参照項目に値が入っている必要がある。NOT NULL制約を後から追加するときと同じ考え方になる。"
      ],
      tip: "「削除」「所有者」「共有」「積み上げ集計」が出たら、まず主従関係を疑う。数字は「主従2・参照40」をセットで覚える。"
    }
  },
  {
    id: "q3",
    domain: "自動化 / フロー",
    trap: "保存後フローはコミット後に動くと誤解する",
    pick: 3,
    stem: "レコードトリガーフローの実行タイミングと保存処理の実行順序について、正しい説明はどれか。3つ選択せよ。",
    options: [
      { key: "A", text: "保存前（高速項目更新）として設定したレコードトリガーフローは、Apexのbeforeトリガーより先に実行される。" },
      { key: "B", text: "保存前フローでトリガー元レコードの項目値を変更しても追加のDML文は発行されないため、保存後フローで同じレコードを更新するより高速でガバナ制限の消費も少ない。" },
      { key: "C", text: "入力規則は保存前フローより先に評価されるため、保存前フローで設定した値は入力規則のチェック対象にならない。" },
      { key: "D", text: "保存後フローの「非同期で実行」パスは、トランザクションがコミットされた後に実行される。" },
      { key: "E", text: "保存後フローはレコードがデータベースにコミットされた後に実行されるため、フロー内で未処理のエラーが発生しても元のレコードの保存は取り消されない。" },
      { key: "F", text: "スケジュールトリガーフローは、レコード保存時の保存前フローと同じトランザクション内で実行される。" }
    ],
    answer: ["A", "B", "D"],
    explanation: {
      summary: "1件のレコード保存は、保存前フロー、beforeトリガー、入力規則、DB保存、afterトリガー、保存後フロー、コミットという固定順の1トランザクションで処理される。保存後フローもコミット前に動き、コミット後に動くのは非同期パスだけ。",
      perOption: {
        A: "保存前フローは、システム検証の直後、beforeトリガーより前に実行される。",
        B: "保存前フローはメモリ上の $Record を書き換えるだけなので、更新用のDMLは発生しない。Salesforceは保存後フローでの同一レコード更新より大幅に高速だと説明している。",
        C: "入力規則は保存前フローとbeforeトリガーの後に評価される。保存前フローがセットした値も入力規則でチェックされる。",
        D: "非同期パスはコミット後に別処理として実行されるので、外部システムへのコールアウトなどに使える。",
        E: "保存後フローはDB保存後・コミット前に、同じトランザクション内で実行される。未処理のエラーが起きるとトランザクション全体がロールバックされ、元のレコードも保存されない。",
        F: "スケジュールトリガーフローは指定日時に起動し、レコード保存とは独立したトランザクションで動く。"
      },
      order: [
        "システム検証",
        "保存前フロー",
        "beforeトリガー",
        "入力規則",
        "重複ルール",
        "DB保存（未コミット）",
        "afterトリガー",
        "割り当て・ワークフロー等",
        "保存後フロー",
        "積み上げ集計・共有再計算",
        "コミット",
        "非同期パス・メール送信"
      ],
      analogy: [
        { it: "BEFORE INSERT/UPDATE トリガーで NEW.column を書き換える", sf: "保存前フロー（追加UPDATE不要）" },
        { it: "AFTER トリガー（同一トランザクション、失敗時はROLLBACK）", sf: "保存後フロー" },
        { it: "コミット後にSQSへ送る Transactional Outbox / AFTER COMMIT フック", sf: "非同期パス" },
        { it: "Cron / EventBridge Scheduler", sf: "スケジュールトリガーフロー" },
        { it: "Lambdaの実行時間や同時実行数のクォータ", sf: "ガバナ制限（1トランザクションあたりSOQL 100回、DML 150回など）" }
      ],
      background: [
        "Salesforceはマルチテナントで計算資源を共有しているため、1トランザクションごとにガバナ制限が課される。保存処理全体を1トランザクションに収めて順序を固定すると、どの自動化が書いた値をどの検証が見るかが常に同じになり、失敗時はまとめてロールバックできる。",
        "未コミットの作業があるトランザクションからは外部へのコールアウトができない。外部API呼び出しは非同期パスに回し、コミット後に実行させる。",
        "使い分けは「同一レコードの項目更新は保存前」「関連レコードの作成・更新やメール送信は保存後」「外部連携は非同期パス」「日時起点の処理はスケジュール」。"
      ],
      tip: "「コミット後」に動くのは非同期パスとコミット後処理だけ。選択肢に「保存後フローはコミット後」とあれば誤り。"
    }
  },
  {
    id: "q4",
    domain: "セキュリティ / ユーザ権限",
    trap: "IAMの明示的Denyと同じ設計をしようとする",
    pick: 1,
    stem: "AWS IAMの設計経験があるエンジニアが、Salesforceのユーザ権限を設計している。Salesforceが推奨する最小権限の考え方に最も合致するものはどれか。",
    options: [
      { key: "A", text: "職務ごとに広めの権限を持つプロファイルを作成し、例外的に禁止したい操作は権限セットで「拒否」して調整する。" },
      { key: "B", text: "全ユーザに必要最小限の権限だけを持つプロファイルを割り当て、職務やプロジェクトに応じた追加権限を権限セット（および権限セットグループ）で付与する。" },
      { key: "C", text: "運用を単純にするため全ユーザに「システム管理者」プロファイルを割り当て、不要な権限は権限セットで除外する。" },
      { key: "D", text: "1人のユーザに複数のプロファイルを割り当て、IAMポリシーと同様に和集合で有効権限を評価させる。" }
    ],
    answer: ["B"],
    explanation: {
      summary: "Salesforceのユーザ権限は付与だけの加算モデルで、明示的なDenyはない。プロファイルで最小限のベースを作り、権限セットで必要な分だけ足すのが推奨設計。",
      perOption: {
        A: "権限セットは権限を付与するだけで、拒否はできない。権限セットグループの「ミュート権限セット」は同じグループ内で付与された権限を打ち消すだけで、プロファイル由来の権限は削れない。",
        B: "プロファイルを最小限のベースにし、権限は権限セットや権限セットグループで部品化して付与する。現在のSalesforceが推奨する設計。",
        C: "最小権限の原則に反する。権限セットで権限を削る手段もない。",
        D: "ユーザに割り当てられるプロファイルは常に1つ。和集合になるのは「プロファイル1つ＋複数の権限セット」の組み合わせ。"
      },
      analogy: [
        { it: "IAM の明示的Deny（Allowより常に優先）", sf: "存在しない" },
        { it: "複数のIAMポリシーのAllowの和集合", sf: "プロファイル1つ ∪ 権限セットn個" },
        { it: "IAMグループ", sf: "権限セットグループ" },
        { it: "Permissions Boundary / SCP（付与できる権限の上限）", sf: "ユーザライセンス・権限セットライセンス（付与可能な権限の上限）" }
      ],
      background: [
        "有効権限は「プロファイル ∪ 割り当てられた全権限セット」で計算される。Denyがないので評価順序や優先順位の問題が起きず、IAMのポリシー評価ロジックよりはるかに単純になる。",
        "プロファイルは1ユーザに必ず1つで、ログイン時間、ログインIP制限、デフォルトのレコードタイプ、ページレイアウトの割り当てなど、ユーザの既定値を持つ。権限まで職務ごとにプロファイルで表現すると、「営業 × マネージャ × API利用」のように組み合わせの数だけプロファイルが増えてしまう。",
        "そのためSalesforceは、プロファイルを少数の最小構成にとどめ、オブジェクト権限やシステム権限は権限セットで付与する方針を推奨している。IAMで言えば、Denyで削る設計を捨てて、マネージドポリシーを足していく設計だけを使う形になる。"
      ],
      tip: "「Deny」「除外」「制限するために権限セットを使う」という選択肢は除外。「プロファイル＝ベース、権限セット＝拡張」と覚える。"
    }
  }
];

const isCorrect = (q, sel) =>
  sel.length === q.answer.length && sel.every((k) => q.answer.includes(k));

const STORAGE_KEY = "admin-spec-drill:v1";

const loadState = () => {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!d || !Array.isArray(d.queue) || d.queue.length === 0) return null;
    if (!d.queue.every((i) => Number.isInteger(i) && QUESTIONS[i])) return null;
    if (!(d.idx >= 0 && d.idx < d.queue.length)) return null;
    return d;
  } catch (e) {
    return null;
  }
};

function Header({ total, answered, correct }) {
  return (
    <header className="bg-band text-onBand">
      <div className="gutter">
        <div className="max-w-3xl mx-auto py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-btn flex items-center justify-center shrink-0">
              <span className="mono text-sm font-semibold text-onBtn">ADM</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs eyebrow opacity-80">SALESFORCE 認定 PLATFORM アドミニストレーター対策</p>
              <h1 className="text-lg font-bold leading-tight">Admin Spec Drill</h1>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm tnum">
            <span>回答 {answered}/{total}</span>
            <span>正解 {correct}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function Stepper({ queue, idx, submitted, results, onJump }) {
  return (
    <nav aria-label="問題一覧" className="flex flex-wrap gap-2">
      {queue.map((qi, i) => {
        const q = QUESTIONS[qi];
        const done = submitted[q.id];
        const ok = results[q.id];
        const active = i === idx;
        let cls = "border-line bg-surface text-muted";
        if (done && ok) cls = "border-ok bg-okSoft text-ok";
        if (done && !ok) cls = "border-ng bg-ngSoft text-ng";
        return (
          <button
            key={q.id}
            id={"step-" + q.id}
            onClick={() => onJump(i)}
            className={"mono tnum text-sm px-3 py-1 rounded border-2 transition " + cls + (active ? " ring-2 ring-brand ring-offset-2 ring-offset-bg" : "")}
            aria-current={active ? "step" : undefined}
          >
            Q{qi + 1}
            {done ? (ok ? " ○" : " ×") : ""}
          </button>
        );
      })}
    </nav>
  );
}

function OptionRow({ q, opt, index, selected, submitted, onToggle }) {
  const multi = q.pick > 1;
  const isAns = q.answer.includes(opt.key);
  let state = "idle";
  if (submitted) {
    if (selected && isAns) state = "hit";
    else if (selected && !isAns) state = "wrong";
    else if (!selected && isAns) state = "missed";
    else state = "neutral";
  } else if (selected) {
    state = "selected";
  }
  const styles = {
    idle: "border-line bg-surface hover:border-brand hover:bg-surface2",
    selected: "border-brand bg-brandSoft",
    hit: "border-ok bg-okSoft",
    wrong: "border-ng bg-ngSoft",
    missed: "border-ok border-dashed bg-surface",
    neutral: "border-line bg-surface opacity-70"
  };
  const labels = {
    hit: { text: "正解", cls: "bg-ok text-surface" },
    wrong: { text: "誤り", cls: "bg-ng text-surface" },
    missed: { text: "選択漏れ", cls: "border border-ok text-ok" }
  };
  const markOn = state === "selected" || state === "hit" || state === "wrong";
  const markColor = state === "wrong" ? "bg-ng border-ng" : state === "hit" ? "bg-ok border-ok" : "bg-brand border-brand";
  return (
    <button
      id={"opt-" + q.id + "-" + opt.key}
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      disabled={submitted}
      onClick={() => onToggle(opt.key)}
      className={"w-full text-left flex gap-3 items-start p-4 rounded-md border-2 transition " + styles[state] + (submitted ? " cursor-default" : " cursor-pointer")}
    >
      <span
        className={"mt-1 w-5 h-5 shrink-0 border-2 flex items-center justify-center " + (multi ? "rounded " : "rounded-full ") + (markOn ? markColor : "border-muted")}
        aria-hidden="true"
      >
        {markOn && (multi
          ? <svg viewBox="0 0 16 16" className="w-3 h-3"><path d="M3 8.5l3 3 7-7" fill="none" stroke="var(--surface)" strokeWidth="2.5" /></svg>
          : <span className="w-2 h-2 rounded-full bg-surface"></span>)}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex flex-wrap items-center gap-2 mb-1">
          <span className="mono text-sm font-semibold text-brandText">{opt.key}</span>
          <span className="mono text-xs text-muted hidden sm:inline">[{index + 1}]</span>
          {labels[state] && (
            <span className={"text-xs font-bold px-2 py-0.5 rounded " + labels[state].cls}>{labels[state].text}</span>
          )}
        </span>
        <span className="block text-fg">{opt.text}</span>
      </span>
    </button>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-xs font-bold eyebrow text-brandText mb-3">{children}</h3>;
}

function Explanation({ q, sel }) {
  const ex = q.explanation;
  return (
    <div className="fade-in flex flex-col gap-6 mt-6 pt-6 border-t border-line">
      <section>
        <SectionTitle>要点</SectionTitle>
        <p className="text-fg font-medium">{ex.summary}</p>
      </section>

      <section>
        <SectionTitle>選択肢ごとの解説</SectionTitle>
        <ul className="flex flex-col gap-3">
          {q.options.map((o) => {
            const ans = q.answer.includes(o.key);
            const picked = sel.includes(o.key);
            return (
              <li key={o.key} className="flex gap-3">
                <span className={"mono text-sm font-semibold w-8 h-8 shrink-0 rounded flex items-center justify-center " + (ans ? "bg-okSoft text-ok" : "bg-surface2 text-muted")}>
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
        <section>
          <SectionTitle>保存処理の実行順序（1トランザクション）</SectionTitle>
          <ol className="flex flex-wrap gap-2">
            {ex.order.map((s, i) => {
              const hl = s.includes("フロー") || s.includes("非同期") || s === "コミット";
              return (
                <li key={s} className={"text-xs px-2 py-1 rounded border tnum " + (hl ? "border-brand bg-brandSoft text-brandText font-bold" : "border-line bg-surface2 text-muted")}>
                  <span className="mono mr-1">{i + 1}</span>{s}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section>
        <SectionTitle>一般IT用語との対比</SectionTitle>
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full text-sm min-w-[480px]">
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

      <section>
        <SectionTitle>なぜSalesforceはこの仕様なのか</SectionTitle>
        <div className="flex flex-col gap-3 max-w-[65ch]">
          {ex.background.map((p, i) => <p key={i} className="text-sm text-fg">{p}</p>)}
        </div>
      </section>

      <section className="rounded-md bg-warnSoft px-4 py-3">
        <p className="text-xs font-bold eyebrow text-warn mb-1">本番での見分け方</p>
        <p className="text-sm text-fg">{ex.tip}</p>
      </section>
    </div>
  );
}

function QuestionCard({ q, number, sel, submitted, onToggle, onSubmit, onNext, isLast }) {
  const multi = q.pick > 1;
  const ready = sel.length === q.pick;
  const ok = submitted && isCorrect(q, sel);
  const hitCount = sel.filter((k) => q.answer.includes(k)).length;
  return (
    <article className="bg-surface border border-line rounded-lg shadow-sm">
      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="mono text-sm font-semibold text-brandText">Q{number}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-surface2 text-muted">{q.domain}</span>
          <span className={"text-xs font-bold px-2 py-0.5 rounded " + (multi ? "bg-brand text-onBtn" : "bg-brandSoft text-brandText")}>
            {multi ? q.pick + "つ選択・部分点なし" : "1つ選択"}
          </span>
        </div>
        <p className="text-xs text-muted mb-2">引っかけポイント：{q.trap}</p>
        <h2 className="text-base sm:text-lg font-bold leading-relaxed mb-5 text-fg">{q.stem}</h2>

        <div className="flex flex-col gap-3" role={multi ? "group" : "radiogroup"} aria-label="選択肢">
          {q.options.map((opt, i) => (
            <OptionRow
              key={opt.key}
              q={q}
              opt={opt}
              index={i}
              selected={sel.includes(opt.key)}
              submitted={submitted}
              onToggle={onToggle}
            />
          ))}
        </div>

        {submitted && (
          <div className={"fade-in mt-6 rounded-md px-4 py-3 border-2 " + (ok ? "border-ok bg-okSoft" : "border-ng bg-ngSoft")}>
            <p className={"text-lg font-black " + (ok ? "text-ok" : "text-ng")}>{ok ? "正解" : "不正解"}</p>
            <p className="text-sm text-fg">
              {ok
                ? "すべての正解を過不足なく選択できています。"
                : multi
                  ? "正解 " + q.answer.join("・") + "。" + q.pick + "つ中 " + hitCount + "つ一致していますが、部分点はないため0点です。"
                  : "正解は " + q.answer[0] + "。"}
            </p>
          </div>
        )}

        {submitted && <Explanation q={q} sel={sel} />}
      </div>

      <div className="sticky bottom-0 z-10 border-t border-line bg-surface2 rounded-b-lg px-5 sm:px-7 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted tnum" aria-live="polite">
          {submitted
            ? "解説を確認したら次へ"
            : multi
              ? (ready ? "選択数OK（" + sel.length + "/" + q.pick + "）" : "あと " + (q.pick - sel.length > 0 ? q.pick - sel.length + "つ選択してください" : (sel.length - q.pick) + "つ外してください") + "（" + sel.length + "/" + q.pick + "）")
              : (ready ? "確定できます" : "1つ選択してください")}
        </p>
        {!submitted ? (
          <button
            id={"submit-" + q.id}
            onClick={onSubmit}
            disabled={!ready}
            className={"px-6 py-2.5 rounded font-bold transition " + (ready ? "bg-btn text-onBtn hover:bg-btnHover" : "bg-line text-muted cursor-not-allowed")}
          >
            回答を確定
          </button>
        ) : (
          <button
            id={"next-" + q.id}
            onClick={onNext}
            className="px-6 py-2.5 rounded font-bold bg-btn text-onBtn hover:bg-btnHover transition"
          >
            {isLast ? "結果を見る" : "次の問題へ"}
          </button>
        )}
      </div>
    </article>
  );
}

function ResultView({ queue, selections, results, onRetryWrong, onRestart, onReview }) {
  const total = queue.length;
  const correct = queue.filter((qi) => results[QUESTIONS[qi].id]).length;
  const rate = Math.round((correct / total) * 100);
  const pass = rate >= 65;
  const wrongCount = total - correct;
  return (
    <div className="fade-in flex flex-col gap-5">
      <section className="bg-surface border border-line rounded-lg p-6 sm:p-8">
        <p className="text-xs font-bold eyebrow text-brandText mb-2">結果</p>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <p className="text-5xl font-black tnum text-fg">{correct}<span className="text-2xl text-muted"> / {total}</span></p>
          <p className={"text-xl font-bold tnum " + (pass ? "text-ok" : "text-ng")}>{rate}%</p>
        </div>
        <div className="mt-4 h-2 rounded-full bg-surface2 overflow-hidden relative">
          <div className={"h-full " + (pass ? "bg-ok" : "bg-ng")} style={{ width: rate + "%" }}></div>
          <div className="absolute top-0 bottom-0 w-0.5 bg-fg" style={{ left: "65%" }}></div>
        </div>
        <p className="text-xs text-muted mt-2">縦線は本試験の合格ライン目安（65%）</p>
      </section>

      <section className="bg-surface border border-line rounded-lg">
        <ul>
          {queue.map((qi, i) => {
            const q = QUESTIONS[qi];
            const ok = results[q.id];
            const sel = selections[q.id] || [];
            return (
              <li key={q.id} className={"flex flex-wrap items-center gap-3 px-5 py-4 " + (i > 0 ? "border-t border-line" : "")}>
                <span className={"text-xs font-bold px-2 py-0.5 rounded w-14 text-center " + (ok ? "bg-okSoft text-ok" : "bg-ngSoft text-ng")}>{ok ? "正解" : "不正解"}</span>
                <span className="mono text-sm font-semibold text-brandText">Q{qi + 1}</span>
                <span className="text-sm text-fg flex-1 min-w-[10rem]">{q.domain}</span>
                <span className="mono text-xs text-muted tnum">選択 {sel.join(",") || "-"} / 正解 {q.answer.join(",")}</span>
                <button id={"review-" + q.id} onClick={() => onReview(i)} className="text-sm font-bold text-brandText hover:underline">解説</button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        {wrongCount > 0 && (
          <button id="retry-wrong" onClick={onRetryWrong} className="px-6 py-2.5 rounded font-bold bg-btn text-onBtn hover:bg-btnHover transition">
            不正解の{wrongCount}問に再挑戦
          </button>
        )}
        <button id="restart" onClick={onRestart} className="px-6 py-2.5 rounded font-bold border-2 border-brand text-brandText bg-surface hover:bg-brandSoft transition">
          最初からやり直す
        </button>
      </div>
    </div>
  );
}

function App() {
  const allIdx = useMemo(() => QUESTIONS.map((_, i) => i), []);
  const saved = useMemo(loadState, []);
  const [queue, setQueue] = useState(saved ? saved.queue : allIdx);
  const [idx, setIdx] = useState(saved ? saved.idx : 0);
  const [selections, setSelections] = useState(saved ? saved.selections : {});
  const [submitted, setSubmitted] = useState(saved ? saved.submitted : {});
  const [results, setResults] = useState(saved ? saved.results : {});
  const [phase, setPhase] = useState(saved ? saved.phase : "quiz");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ queue, idx, selections, submitted, results, phase }));
    } catch (e) {}
  }, [queue, idx, selections, submitted, results, phase]);

  const q = QUESTIONS[queue[idx]];
  const sel = selections[q.id] || [];
  const isSubmitted = !!submitted[q.id];
  const isLast = idx === queue.length - 1;

  const answeredCount = queue.filter((qi) => submitted[QUESTIONS[qi].id]).length;
  const correctCount = queue.filter((qi) => results[QUESTIONS[qi].id]).length;

  const toggle = useCallback((key) => {
    if (submitted[q.id]) return;
    setSelections((prev) => {
      const cur = prev[q.id] || [];
      let next;
      if (q.pick === 1) next = [key];
      else next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key].sort();
      return { ...prev, [q.id]: next };
    });
  }, [q, submitted]);

  const submit = useCallback(() => {
    const cur = selections[q.id] || [];
    if (cur.length !== q.pick || submitted[q.id]) return;
    setSubmitted((p) => ({ ...p, [q.id]: true }));
    setResults((p) => ({ ...p, [q.id]: isCorrect(q, cur) }));
  }, [q, selections, submitted]);

  const next = useCallback(() => {
    if (isLast) setPhase("result");
    else setIdx((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [isLast]);

  const jump = (i) => {
    setIdx(i);
    setPhase("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetFor = (indices) => {
    const ids = indices.map((qi) => QUESTIONS[qi].id);
    const strip = (obj) => {
      const o = { ...obj };
      ids.forEach((id) => delete o[id]);
      return o;
    };
    setSelections(strip);
    setSubmitted(strip);
    setResults(strip);
    setQueue(indices);
    setIdx(0);
    setPhase("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const retryWrong = () => resetFor(queue.filter((qi) => !results[QUESTIONS[qi].id]));
  const restart = () => resetFor(allIdx);

  useEffect(() => {
    const onKey = (e) => {
      if (phase !== "quiz" || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = parseInt(e.key, 10);
      if (!isNaN(n) && n >= 1 && n <= q.options.length) {
        e.preventDefault();
        toggle(q.options[n - 1].key);
        return;
      }
      if (e.key === "Enter") {
        const tag = document.activeElement && document.activeElement.tagName;
        if (tag === "BUTTON" && document.activeElement.id && !document.activeElement.id.startsWith("opt-")) return;
        e.preventDefault();
        if (isSubmitted) next();
        else submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, q, toggle, submit, next, isSubmitted]);

  const progress = Math.round((answeredCount / queue.length) * 100);

  return (
    <div className="min-h-full">
      <Header total={queue.length} answered={answeredCount} correct={correctCount} />
      <div className="h-1 bg-surface2">
        <div className="h-full bg-brand transition-all" style={{ width: progress + "%" }}></div>
      </div>
      <main className="gutter">
        <div className="max-w-3xl mx-auto py-6 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Stepper queue={queue} idx={phase === "quiz" ? idx : -1} submitted={submitted} results={results} onJump={jump} />
            <p className="text-xs text-muted hidden sm:block">キー操作：<span className="mono">1〜6</span> 選択 / <span className="mono">Enter</span> 確定・次へ</p>
          </div>

          {phase === "quiz" ? (
            <QuestionCard
              key={q.id}
              q={q}
              number={queue[idx] + 1}
              sel={sel}
              submitted={isSubmitted}
              onToggle={toggle}
              onSubmit={submit}
              onNext={next}
              isLast={isLast}
            />
          ) : (
            <ResultView
              queue={queue}
              selections={selections}
              results={results}
              onRetryWrong={retryWrong}
              onRestart={restart}
              onReview={jump}
            />
          )}

          <p className="text-xs text-muted">
            採点はALL or NOTHING。複数選択問題は指定数ちょうどを選ばないと確定できません。仕様の記述は執筆時点のSalesforceドキュメントに基づきます。
          </p>
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
