# プロジェクト規約（Admin Spec Drill）

- 静的サイト（GitHub Pages、`main` ブランチの `docs/`）。サーバは持たず、学習記録は localStorage に保存する。
- **Feature単位分割**: `src/features/<feature>/{domain,components}`。`domain/` は副作用なしの純関数のみ（ユニットテスト対象）。
- 状態の変更は `src/lib/store.tsx` の操作関数に集約する。画面から localStorage を直接触らない。
- localStorage の値は必ず `parseState` を通して読む（壊れた・古い形式のデータに耐える）。
- 問題 ID（`<分野>-NN`）は学習履歴のキー。既存 ID の変更・再利用はしない。
- 問題の正確性が最優先。確信の持てない仕様・数値は出題しない。
- **カタカナ表記**: 末尾長音を省略（ユーザ / サーバ / フォルダ 等）。
- 変更後は `npm run typecheck` と `npm test` を通し、`npm run build` で `docs/` を更新してコミットする。
