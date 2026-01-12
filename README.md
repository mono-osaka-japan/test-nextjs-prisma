# Test Project

Next.js 16 ベースのフルスタック Web アプリケーション。Docker によるコンテナ化に対応しています。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **State Management** | Zustand |
| **Data Fetching** | TanStack Query (React Query) |
| **Form Handling** | React Hook Form + Zod |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis 7 |
| **ORM** | Prisma 6 |
| **Container** | Docker + Docker Compose |

## クイックスタート

### 前提条件

- Node.js 20.x 以上
- Docker & Docker Compose
- npm または yarn

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env.local
```

必要に応じて `.env.local` を編集してください。

### 3. 開発サーバーの起動

**ローカル開発（データベースのみ Docker）:**

```bash
# PostgreSQL と Redis を起動
docker-compose up -d postgres redis

# マイグレーションを実行
npx prisma migrate dev

# 開発サーバーを起動
npm run dev
```

**フル Docker 環境:**

```bash
# すべてのサービスをビルド & 起動
docker-compose up -d --build

# マイグレーションを実行（ホストから）
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/testdb?schema=public" npx prisma migrate deploy
```

アプリケーションは http://localhost:3000 でアクセスできます。

## Docker デプロイ

### アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
├─────────────────┬─────────────────┬─────────────────────┤
│   Next.js App   │   PostgreSQL    │       Redis         │
│   (Port 3000)   │   (Port 5432)   │    (Port 6379)      │
│                 │                 │                     │
│  - Standalone   │  - Data Volume  │  - Data Volume      │
│  - Prisma ORM   │  - Health Check │  - Health Check     │
└─────────────────┴─────────────────┴─────────────────────┘
```

### コンテナ構成

| サービス | イメージ | 説明 |
|---------|---------|------|
| `app` | カスタムビルド | Next.js アプリケーション（standalone モード） |
| `postgres` | postgres:16-alpine | PostgreSQL データベース |
| `redis` | redis:7-alpine | Redis キャッシュサーバー |

### デプロイ手順

#### 基本デプロイ

```bash
# ビルド & 起動
docker-compose up -d --build

# ログ確認
docker-compose logs -f app

# 状態確認
docker-compose ps
```

#### 特定 IP アドレスへのバインド

`docker-compose.yml` の `ports` セクションを編集：

```yaml
services:
  app:
    ports:
      - '10.0.0.200:0:3000'  # ランダムポート
      # または
      - '10.0.0.200:3000:3000'  # 固定ポート
```

#### マイグレーション実行

コンテナ起動後、ホストからマイグレーションを実行：

```bash
# ポート確認
docker-compose ps

# マイグレーション実行（ポートは実際の値に置き換え）
DATABASE_URL="postgresql://postgres:postgres@10.0.0.200:PORT/testdb?schema=public" npx prisma migrate deploy
```

### Docker コマンド一覧

```bash
# 起動
docker-compose up -d              # バックグラウンド起動
docker-compose up -d --build      # リビルド + 起動

# 停止
docker-compose down               # 停止（ボリューム保持）
docker-compose down -v            # 停止 + ボリューム削除

# ログ
docker-compose logs -f            # 全サービスのログ
docker-compose logs -f app        # アプリのログのみ

# 状態確認
docker-compose ps                 # コンテナ状態
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# コンテナ内操作
docker-compose exec app sh        # アプリコンテナに入る
docker-compose exec postgres psql -U postgres -d testdb  # DB 接続
docker-compose exec redis redis-cli  # Redis CLI
```

## プロジェクト構造

```
.
├── prisma/
│   ├── migrations/          # Prisma マイグレーション
│   ├── schema.prisma        # データベーススキーマ
│   └── seed.ts              # シードデータ
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API Routes
│   │   ├── dashboard/       # ダッシュボードページ
│   │   ├── login/           # ログインページ
│   │   ├── patterns/        # パターン管理ページ
│   │   ├── layout.tsx       # ルートレイアウト
│   │   ├── page.tsx         # ホームページ
│   │   └── globals.css      # グローバルスタイル
│   ├── components/
│   │   └── ui/              # shadcn/ui コンポーネント
│   ├── hooks/               # カスタム React hooks
│   ├── lib/                 # ユーティリティ関数
│   ├── stores/              # Zustand ストア
│   └── types/               # TypeScript 型定義
├── docker-compose.yml       # Docker Compose 設定
├── Dockerfile               # アプリビルド設定
├── .dockerignore            # Docker ビルド除外
├── next.config.mjs          # Next.js 設定
├── tailwind.config.ts       # Tailwind CSS 設定
├── tsconfig.json            # TypeScript 設定
└── package.json             # 依存関係 & スクリプト
```

## データベーススキーマ

### 主要モデル

| モデル | 説明 |
|--------|------|
| `User` | ユーザー情報 |
| `Account` | OAuth アカウント連携 |
| `Session` | セッション管理 |
| `Post` | 投稿コンテンツ |
| `Comment` | コメント |
| `Category` / `Tag` | 分類 |
| `Campaign` | 案件管理 |
| `Pattern` | 自動化パターン |
| `PatternStep` | パターンステップ |
| `SystemGroup` | システムグループ |

詳細は `prisma/schema.prisma` を参照してください。

## 開発コマンド

```bash
# 開発
npm run dev             # 開発サーバー起動
npm run build           # プロダクションビルド
npm run start           # プロダクション起動

# コード品質
npm run lint            # ESLint 実行
npm run lint:fix        # ESLint 自動修正
npm run format          # Prettier フォーマット
npm run format:check    # フォーマットチェック

# テスト
npm test                # テスト実行
npm run test:watch      # ウォッチモード
npm run test:coverage   # カバレッジ付き

# Prisma
npx prisma generate     # クライアント生成
npx prisma migrate dev  # マイグレーション作成 & 適用
npx prisma migrate deploy  # マイグレーション適用（本番）
npx prisma studio       # GUI ツール起動
npx prisma db seed      # シードデータ投入
```

## 環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `DATABASE_URL` | PostgreSQL 接続文字列 | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis 接続文字列 | `redis://host:6379` |
| `NEXT_PUBLIC_APP_URL` | アプリケーション URL | `http://localhost:3000` |
| `POSTGRES_USER` | PostgreSQL ユーザー名 | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL パスワード | `postgres` |
| `POSTGRES_DB` | PostgreSQL データベース名 | `testdb` |

## トラブルシューティング

### Docker ビルドエラー

```bash
# キャッシュをクリアしてリビルド
docker-compose build --no-cache
```

### データベース接続エラー

```bash
# PostgreSQL ログ確認
docker-compose logs postgres

# コンテナの健全性確認
docker-compose ps
```

### マイグレーションエラー

```bash
# マイグレーション状態確認
npx prisma migrate status

# マイグレーションリセット（開発環境のみ）
npx prisma migrate reset
```

### ポート競合

```bash
# 使用中のポート確認
lsof -i :3000
lsof -i :5432

# ランダムポート使用（docker-compose.yml で設定）
ports:
  - '0:3000'  # ホスト側はランダムポート
```

## ライセンス

MIT License
