# デプロイメントガイド

## 本番環境での環境変数設定

本番環境でアプリケーションを正しく動作させるには、以下の環境変数を設定する必要があります。

### 必須環境変数

- `VITE_SUPABASE_URL`: SupabaseプロジェクトのURL
- `VITE_SUPABASE_ANON_KEY`: Supabaseの匿名キー

### プラットフォーム別設定方法

#### Netlify

1. Netlifyのダッシュボードにログイン
2. デプロイしたサイトを選択
3. `Site settings` → `Environment variables` を開く
4. 以下の環境変数を追加:
   - Key: `VITE_SUPABASE_URL`
     Value: あなたのSupabase URL（例: `https://xxxxx.supabase.co`）
   - Key: `VITE_SUPABASE_ANON_KEY`
     Value: あなたのSupabase匿名キー
5. 変更を保存し、サイトを再デプロイ

#### Vercel

1. Vercelのダッシュボードにログイン
2. デプロイしたプロジェクトを選択
3. `Settings` → `Environment Variables` を開く
4. 以下の環境変数を追加:
   - Name: `VITE_SUPABASE_URL`
     Value: あなたのSupabase URL
   - Name: `VITE_SUPABASE_ANON_KEY`
     Value: あなたのSupabase匿名キー
5. 変更を保存し、プロジェクトを再デプロイ

### Supabase認証情報の取得方法

1. [Supabaseダッシュボード](https://app.supabase.com/)にログイン
2. プロジェクトを選択
3. サイドバーから `Settings` → `API` を開く
4. `Project URL` と `anon public` キーをコピー

### 環境変数が設定されていない場合

環境変数が設定されていない場合、アプリケーションは以下のように動作します:

- ローカルストレージのみでデータを保存
- ログイン機能は無効
- データの共有機能は無効
- 画面上部に警告メッセージが表示

## トラブルシューティング

### 画面が真っ白になる場合

1. ブラウザのコンソールを開いてエラーメッセージを確認
2. 環境変数が正しく設定されているか確認
3. キャッシュをクリアして再読み込み
4. 必要に応じて、デプロイプラットフォームで再ビルド

### データベース接続エラー

- Supabase URLとキーが正しいか確認
- Supabaseプロジェクトが有効かどうか確認
- ネットワーク接続を確認
