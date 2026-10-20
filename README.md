# Admin Spec Drill

Salesforce認定Platformアドミニストレーター試験のうち、エンジニアが引っかかりやすい仕様（共有・リレーション・フロー・権限）を練習するドリルです。スマホのホーム画面に追加して使えるPWAで、一度開けば圏外でも動きます。

- 複数選択問題は指定数ちょうど選ばないと確定できません
- 採点は部分点なし（ALL or NOTHING）
- 回答後に、一般的なIT用語（RDB、IAM、Cron など）との対比を交えた解説を表示します
- 進捗は端末に保存されます

## 使い方

公開URL: https://hironobuakiyama-collab.github.io/admin-spec-drill/

- iPhone: Safariで開き、共有ボタン →「ホーム画面に追加」
- Android: Chromeのメニュー →「アプリをインストール」

## 開発

```sh
npm install
npm run build
```

`src/main.jsx` の `QUESTIONS` が問題データです。ビルドすると `docs/` に公開用ファイルが出力され、GitHub Pages は `main` ブランチの `docs/` から配信します。
