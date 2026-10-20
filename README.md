# Admin Spec Drill

Salesforce認定 Platform アドミニストレーター試験の対策ドリルです。応用情報技術者や AWS SAA を持つエンジニアが引っかかりやすい Salesforce 固有の仕様を、一般的な IT 用語との対比で解説します。スマホのホーム画面に追加して使える PWA で、一度開けば圏外でも動きます。

設計は [gmap-drill](https://github.com/hironobuakiyama-collab/gmap-drill) を参考にしています。

> 問題はすべて公開情報に基づくオリジナルです。実際の試験問題は含みません。配点・問題数・制限時間は 2025年12月改訂の試験ガイドに関する公開情報をもとにした目安なので、受験前に Trailhead の公式試験ガイドで確認してください。

## 使い方

公開URL: https://hironobuakiyama-collab.github.io/admin-spec-drill/

- iPhone: Safari で開き、共有ボタン →「ホーム画面に追加」
- Android: Chrome のメニュー →「アプリをインストール」
- パソコン: 上の URL をブラウザで開く。ダウンロードした場合は `docs/index.html` をダブルクリック

## 学習分野（試験ガイドの8分野・計65問）

| 分野 | 配点 | 問題数 |
|---|---|---|
| 設定とセットアップ | 15% | 10 |
| オブジェクトマネージャと Lightning アプリケーションビルダー | 15% | 9 |
| セールス＆マーケティングアプリケーション | 10% | 7 |
| サービス＆サポートアプリケーション | 10% | 7 |
| 生産性とコラボレーション | 10% | 7 |
| データと分析の管理 | 17% | 10 |
| 自動化 | 15% | 9 |
| Agentforce | 8% | 6 |

## 主な機能

- **今日の10問**: 復習の優先度順に毎日10問
- **模試**: 20問35分 / 40問70分 / 60問105分。配点に比例して分野を按分し、解答中は正誤を出さない。見直しフラグ・問題一覧・時間切れで自動採点
- **弱点克服**: 初見正答率の低い分野から優先して出題
- **間違い復習**: 直近で不正解の問題だけを反復
- **分野別学習 / 問題一覧 / ブックマーク**
- **ALL or NOTHING 採点**: 複数選択は指定数ちょうど選ぶまで確定できず、部分点なし
- **解説**: 選択肢ごとの正誤理由、一般 IT 用語（RDB・IAM・Cron など）との対比表、「なぜ Salesforce はこの仕様か」、本番での見分け方
- **ダッシュボード**: 初見正答率、配点で重み付けした見込み得点、分野別の消化率、苦手分野、直近14日の推移、難易度別、解答スピード（本番の1問105秒と比較）
- **学習履歴 / バックアップ**: 記録は端末に保存。JSON で書き出し・取り込みでき、機種変更やスマホとパソコンの記録の統合に使える

## 復習アルゴリズム

gmap-drill と同じ優先度バケット（`src/features/review/domain/priority.ts`）。高い順に、今日間違えた問題 → 3日以内に間違えた → 7日以内に間違えた → それ以前に間違えたまま → 未回答 → 正解済み。

## 技術構成

```
スマホ(PWA) → GitHub Pages（静的ファイル） ／ 学習記録は端末の localStorage
```

gmap-drill は Next.js + Supabase でサーバに記録を保存しますが、このアプリはアカウント作成やサーバ運用なしで使えるように、すべて端末内で完結させています。

- React 18 / TypeScript / Tailwind CSS 3 / esbuild / Vitest
- ドメインロジック（採点・出題選定・復習優先度・連続日数・分析・保存形式の検証）は `src/features/*/domain` の純関数で、ユニットテスト対象
- 画面切り替えはハッシュルータ（`src/lib/router.tsx`）。GitHub Pages で任意パスを配信できないため
- Service Worker（`public/sw.js`）でアプリ一式をキャッシュし、オフラインで動作

## ディレクトリ構成

```
src/
  config/categories.ts        出題分野と配点
  data/types.ts               問題データの型
  data/questions/*.ts         分野ごとの問題（questions.test.ts で整合性を検証）
  features/
    quiz/domain/              採点（ALL or NOTHING）・出題選定（按分・弱点・模試）
    quiz/components/          問題表示・解説・出題進行
    review/domain/            復習優先度
    dashboard/domain/         連続日数・分析
    history/domain/           学習記録の型と再構成
    storage/domain/           保存状態の検証・バックアップの統合
  lib/store.tsx               状態管理と localStorage 保存
  lib/router.tsx              ハッシュルータ
  app/*.tsx                   各画面
docs/                         ビルド成果物（GitHub Pages の配信元）
```

## 開発

```sh
npm install
npm run typecheck
npm test
npm run build   # docs/ に出力
```

問題を追加するときは `src/data/questions/<分野>.ts` の末尾に追記し、ID は続きの連番にします。ID は学習履歴のキーなので、既存の ID は変更しないでください。
