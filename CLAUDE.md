# Test Project

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **State Management** | Zustand |
| **Data Fetching** | TanStack Query (React Query) |
| **Form Handling** | React Hook Form + Zod |
| **Database** | PostgreSQL 16 (via Docker) |
| **Cache** | Redis 7 (via Docker) |
| **ORM** | Prisma 6 |
| **Container** | Docker + Docker Compose |

## Project Structure

```
.
├── prisma/
│   ├── migrations/          # Database migrations (PostgreSQL)
│   ├── schema.prisma        # Prisma schema definition
│   └── seed.ts              # Seed data script
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API Routes
│   │   │   ├── alerts/
│   │   │   ├── auth/        # Authentication endpoints
│   │   │   ├── campaigns/   # Campaign management
│   │   │   ├── dashboard/
│   │   │   ├── exclusions/
│   │   │   ├── export/
│   │   │   ├── patterns/    # Pattern management
│   │   │   ├── results/
│   │   │   ├── scraping/
│   │   │   ├── sync/
│   │   │   └── system-groups/
│   │   ├── dashboard/       # Dashboard page
│   │   ├── login/           # Login page
│   │   ├── patterns/        # Patterns page
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   └── globals.css      # Global styles
│   ├── components/
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions & Prisma client
│   ├── stores/              # Zustand stores
│   └── types/               # TypeScript type definitions
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile               # Multi-stage Docker build
├── .dockerignore            # Docker build exclusions
├── next.config.mjs          # Next.js config (standalone output)
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies & scripts
```

## Commands

### Development

```bash
npm run dev             # Start dev server (Turbopack)
npm run build           # Production build
npm run start           # Start production server
```

### Code Quality

```bash
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint errors
npm run format          # Format with Prettier
npm run format:check    # Check formatting
```

### Testing

```bash
npm test                # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

### Prisma

```bash
npx prisma generate     # Generate Prisma Client
npx prisma migrate dev  # Create & apply migrations (dev)
npx prisma migrate deploy  # Apply migrations (production)
npx prisma studio       # Open Prisma Studio GUI
npx prisma db seed      # Run seed script
npx prisma migrate status  # Check migration status
```

### Docker

```bash
# Development (DB only)
docker-compose up -d postgres redis

# Full deployment
docker-compose up -d --build

# Logs
docker-compose logs -f app
docker-compose logs -f postgres

# Stop
docker-compose down          # Keep volumes
docker-compose down -v       # Remove volumes

# Status
docker-compose ps
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# Container access
docker-compose exec app sh
docker-compose exec postgres psql -U postgres -d testdb
docker-compose exec redis redis-cli
```

## Docker Deployment

### Architecture

The application runs in a containerized environment with three services:

- **app**: Next.js application (standalone mode)
- **postgres**: PostgreSQL 16 database with persistent volume
- **redis**: Redis 7 cache with persistent volume

### IP Binding

Services are configured to bind to `10.0.0.200` with random ports:

```yaml
ports:
  - '10.0.0.200:0:3000'  # Random host port -> container 3000
```

### Running Migrations

After starting containers, run migrations from host:

```bash
# Check assigned ports
docker-compose ps

# Run migrations (replace PORT with actual value)
DATABASE_URL="postgresql://postgres:postgres@10.0.0.200:PORT/testdb" npx prisma migrate deploy
```

### Dockerfile Details

Multi-stage build optimized for Next.js:

1. **deps**: Install dependencies
2. **builder**: Build application + generate Prisma client
3. **runner**: Minimal production image with standalone output

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@postgres:5432/testdb` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `NEXT_PUBLIC_APP_URL` | Public application URL | `http://localhost:3000` |
| `POSTGRES_USER` | PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` |
| `POSTGRES_DB` | PostgreSQL database name | `testdb` |
| `NODE_ENV` | Node environment | `development` |

## Database Schema

### Core Models

| Model | Description |
|-------|-------------|
| `User` | User accounts with authentication |
| `Account` | OAuth provider accounts |
| `Session` | User sessions |
| `Profile` | User profile information |

### Content Models

| Model | Description |
|-------|-------------|
| `Post` | Blog posts / articles |
| `Comment` | Post comments (nested) |
| `Category` | Post categories |
| `Tag` | Post tags |
| `Media` | Uploaded media files |

### Social Models

| Model | Description |
|-------|-------------|
| `Like` | Post likes |
| `Bookmark` | Post bookmarks |
| `Follow` | User follow relationships |
| `Notification` | User notifications |

### Business Models

| Model | Description |
|-------|-------------|
| `Campaign` | Marketing campaigns |
| `CampaignTask` | Campaign tasks |
| `SystemGroup` | System groupings |
| `Pattern` | Automation patterns |
| `PatternStep` | Pattern action steps |
| `PatternTestResult` | Pattern test results |

### Audit

| Model | Description |
|-------|-------------|
| `AuditLog` | System audit trail |

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current user info

### Campaigns

- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/[id]` - Get campaign
- `PUT /api/campaigns/[id]` - Update campaign
- `DELETE /api/campaigns/[id]` - Delete campaign
- `POST /api/campaigns/analyze-url` - Analyze URL for campaign

### Patterns

- `GET /api/patterns` - List patterns
- `POST /api/patterns` - Create pattern
- `GET /api/patterns/[id]` - Get pattern
- `PUT /api/patterns/[id]` - Update pattern
- `DELETE /api/patterns/[id]` - Delete pattern
- `POST /api/patterns/[id]/test` - Test pattern
- `GET /api/patterns/[id]/steps` - List pattern steps
- `POST /api/patterns/[id]/steps` - Create pattern step

### System Groups

- `GET /api/system-groups` - List system groups
- `POST /api/system-groups` - Create system group
- `GET /api/system-groups/[id]` - Get system group
- `PUT /api/system-groups/[id]` - Update system group
- `DELETE /api/system-groups/[id]` - Delete system group

### Dashboard

- `GET /api/dashboard` - Dashboard stats
- `GET /api/dashboard/alerts` - Dashboard alerts

### Export

- `GET /api/export/csv` - Export data as CSV

### Sync

- `POST /api/sync/google-sheets` - Sync with Google Sheets
- `POST /api/sync/slack` - Sync with Slack

## Coding Standards

- Use TypeScript strict mode
- Follow ESLint + Prettier rules
- Write tests for business logic
- Use path aliases (`@/`) for imports
- Keep components small and focused
- Use Prisma for all database operations
- Handle errors with proper HTTP status codes
- Document API endpoints with JSDoc comments
