# Test Project

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Form Handling**: React Hook Form + Zod
- **Database**: PostgreSQL (via Docker)
- **Cache**: Redis (via Docker)

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── stores/             # Zustand stores
├── types/              # TypeScript type definitions
└── __tests__/          # Test files
```

## Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Production build
npm run start         # Start production server

# Code Quality
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint errors
npm run format        # Format code with Prettier
npm run format:check  # Check code formatting

# Testing
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Docker
docker-compose up -d         # Start PostgreSQL & Redis
docker-compose down          # Stop containers
docker-compose logs -f       # View logs
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `NEXT_PUBLIC_APP_URL`: Application URL

## Coding Standards

- Use TypeScript strict mode
- Follow ESLint + Prettier rules
- Write tests for business logic
- Use path aliases (`@/`) for imports
- Keep components small and focused (200行超で分割)
- any型禁止（unknown + 型ガード、Zod を使用）

## タスク完了時の必須フロー（重要）

コード変更を含む**全タスク**で以下のフローを必ず実行:

```
実装完了 → 静的解析 → Codexレビュー → GitHub更新
```

| Step | コマンド/アクション | 完了条件 |
|------|---------------------|----------|
| 1. 静的解析 | `npm run build` | パス |
| 2. Codexレビュー | `/codex-review` | `ok: true` 取得 |
| 3. GitHub更新 | `git add && commit && push` | プッシュ完了 |
| 4. PR/マージ | `gh pr create` / `gh pr merge` | マージ完了 |

### 絶対禁止事項

- 「簡単な変更なのでスキップ」→ どんな小さな変更でも実行必須
- 「時間がないのでスキップ」→ このフローなしのマージは禁止
- 「手動レビューで代替」→ Codexレビューの代替は存在しない

### TodoWriteでのトラッキング

タスク開始時、以下のTodoを追加して進捗を可視化:

```
- [ ] 実装
- [ ] 静的解析（npm run build）
- [ ] Codexレビュー（ok: true）
- [ ] GitHub更新（commit, push, PR/merge）
```
