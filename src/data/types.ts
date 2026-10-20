import type { CategorySlug } from "@/config/categories";

export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type Choice = {
  /** "A" から始まる連番 */
  key: string;
  text: string;
};

export type Analogy = {
  /** 一般的なIT / AWS / RDB 側の概念 */
  it: string;
  /** 対応する Salesforce 側の概念 */
  sf: string;
};

export type Explanation = {
  /** 正解の根拠を2〜3文で */
  summary: string;
  /** 全選択肢について、なぜ正しい / 誤りか */
  perOption: Record<string, string>;
  /** 一般IT用語との対比（2〜5行） */
  analogy: Analogy[];
  /** なぜSalesforceはこの仕様なのか（技術的背景、2〜3段落） */
  background: string[];
  /** 本番で選択肢を見分けるコツ */
  tip: string;
  /** 処理順序など、順番そのものが知識である場合のみ */
  order?: string[];
};

export type Question = {
  /** 分野ごとの連番 ID（例: "setup-01"）。学習履歴のキーになるため変更しない */
  id: string;
  category: CategorySlug;
  difficulty: Difficulty;
  /** 選択する個数。1 なら単一選択、2 以上は複数選択（部分点なし） */
  pick: number;
  /** エンジニアが引っかかりやすいポイント（1行） */
  trap: string;
  stem: string;
  options: Choice[];
  /** 正解の key。length は pick と一致する */
  answer: string[];
  explanation: Explanation;
};
