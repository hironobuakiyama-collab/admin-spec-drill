/**
 * 出題分野の定義。Salesforce認定 Platform アドミニストレーター試験の出題範囲に対応する。
 *
 * `weight` は試験ガイドの配点（%）。2025年12月改訂版の公表値を目安として持ち、
 * 模試の分野配分とダッシュボードの「配点に対する進捗」に使う。
 */
export const CATEGORIES = [
  { slug: "setup", name: "設定とセットアップ", short: "設定", weight: 15, order: 1 },
  { slug: "object", name: "オブジェクトマネージャとLightningアプリケーションビルダー", short: "オブジェクト", weight: 15, order: 2 },
  { slug: "sales", name: "セールス＆マーケティングアプリケーション", short: "セールス", weight: 10, order: 3 },
  { slug: "service", name: "サービス＆サポートアプリケーション", short: "サービス", weight: 10, order: 4 },
  { slug: "productivity", name: "生産性とコラボレーション", short: "生産性", weight: 10, order: 5 },
  { slug: "data", name: "データと分析の管理", short: "データ", weight: 17, order: 6 },
  { slug: "automation", name: "自動化", short: "自動化", weight: 15, order: 7 },
  { slug: "agentforce", name: "Agentforce", short: "Agentforce", weight: 8, order: 8 },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_SLUGS: CategorySlug[] = CATEGORIES.map((c) => c.slug);

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getCategoryName(slug: string): string {
  return getCategory(slug)?.name ?? slug;
}
