import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hash } from "bcryptjs";
import path from "path";

// Database is at project root (relative to prisma.config.ts)
const dbPath = path.join(__dirname, "..", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean up existing data
  await prisma.campaignTask.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.media.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "テクノロジー",
        slug: "technology",
        description: "技術に関する記事",
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: "ライフスタイル",
        slug: "lifestyle",
        description: "生活に関する記事",
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: "ビジネス",
        slug: "business",
        description: "ビジネスに関する記事",
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        name: "エンターテイメント",
        slug: "entertainment",
        description: "エンターテイメントに関する記事",
        sortOrder: 4,
      },
    }),
  ]);
  console.log(`Created ${categories.length} categories`);

  // Create Tags
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: "JavaScript", slug: "javascript" } }),
    prisma.tag.create({ data: { name: "TypeScript", slug: "typescript" } }),
    prisma.tag.create({ data: { name: "React", slug: "react" } }),
    prisma.tag.create({ data: { name: "Next.js", slug: "nextjs" } }),
    prisma.tag.create({ data: { name: "Prisma", slug: "prisma" } }),
    prisma.tag.create({ data: { name: "データベース", slug: "database" } }),
    prisma.tag.create({ data: { name: "チュートリアル", slug: "tutorial" } }),
    prisma.tag.create({ data: { name: "初心者向け", slug: "beginner" } }),
  ]);
  console.log(`Created ${tags.length} tags`);

  // Create Users
  // Default password for all seed users: "password123"
  const defaultPassword = await hash("password123", 12);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "管理者",
      passwordHash: defaultPassword,
      role: "ADMIN",
      emailVerified: new Date(),
      profile: {
        create: {
          bio: "サイトの管理者です。",
          location: "東京, 日本",
          website: "https://example.com",
        },
      },
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: "tanaka@example.com",
      name: "田中太郎",
      passwordHash: defaultPassword,
      role: "USER",
      emailVerified: new Date(),
      profile: {
        create: {
          bio: "プログラミングが好きなエンジニアです。",
          location: "大阪, 日本",
          website: "https://tanaka.example.com",
        },
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "suzuki@example.com",
      name: "鈴木花子",
      passwordHash: defaultPassword,
      role: "USER",
      emailVerified: new Date(),
      profile: {
        create: {
          bio: "デザイナー兼フロントエンドエンジニア。",
          location: "名古屋, 日本",
        },
      },
    },
  });

  const moderatorUser = await prisma.user.create({
    data: {
      email: "moderator@example.com",
      name: "モデレーター山田",
      passwordHash: defaultPassword,
      role: "MODERATOR",
      emailVerified: new Date(),
      profile: {
        create: {
          bio: "コミュニティのモデレーターをしています。",
        },
      },
    },
  });

  // Create Demo User (for development only)
  // セキュリティ: 本番環境では絶対に作成しない
  // NODE_ENV が明示的に "development" または "test" の場合のみ作成
  const isDevelopmentEnv = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
  let demoUser = null;
  if (isDevelopmentEnv) {
    demoUser = await prisma.user.create({
      data: {
        id: "demo-user-id", // Fixed ID for development
        email: "demo@example.com",
        name: "Demo User",
        role: "USER",
        emailVerified: new Date(),
        profile: {
          create: {
            bio: "開発用のデモユーザーです。",
          },
        },
      },
    });
    console.log("Created 5 users (including demo user)");
  } else {
    console.log("Created 4 users (demo user skipped - not in development/test environment)");
  }

  // Create Posts
  const post1 = await prisma.post.create({
    data: {
      title: "Next.js 15の新機能について",
      slug: "nextjs-15-new-features",
      content: `
# Next.js 15の新機能

Next.js 15では多くの新機能が追加されました。

## 主な変更点

1. **React 19サポート**
2. **Turbopackの安定化**
3. **Server Actionsの改善**

これらの機能により、開発体験が大幅に向上しています。
      `.trim(),
      excerpt: "Next.js 15で追加された新機能を紹介します。",
      status: "PUBLISHED",
      publishedAt: new Date(),
      viewCount: 150,
      authorId: adminUser.id,
      categoryId: categories[0].id,
      tags: {
        create: [
          { tagId: tags[3].id }, // Next.js
          { tagId: tags[1].id }, // TypeScript
          { tagId: tags[6].id }, // チュートリアル
        ],
      },
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: "Prismaでデータベース操作を簡単に",
      slug: "prisma-database-tutorial",
      content: `
# Prismaでデータベース操作を簡単に

PrismaはNode.js/TypeScript向けのORMです。

## セットアップ

\`\`\`bash
npm install prisma @prisma/client
npx prisma init
\`\`\`

## スキーマ定義

Prismaスキーマでモデルを定義できます。
      `.trim(),
      excerpt: "Prismaを使ったデータベース操作の基本を解説します。",
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 86400000), // 1 day ago
      viewCount: 230,
      authorId: user1.id,
      categoryId: categories[0].id,
      tags: {
        create: [
          { tagId: tags[4].id }, // Prisma
          { tagId: tags[5].id }, // データベース
          { tagId: tags[7].id }, // 初心者向け
        ],
      },
    },
  });

  const post3 = await prisma.post.create({
    data: {
      title: "リモートワークを快適にする5つのコツ",
      slug: "remote-work-tips",
      content: `
# リモートワークを快適にする5つのコツ

1. 作業環境を整える
2. 定期的な休憩を取る
3. コミュニケーションを大切にする
4. 仕事とプライベートの境界を設ける
5. 健康管理を怠らない
      `.trim(),
      excerpt: "リモートワークを効率的に行うためのコツを紹介します。",
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 172800000), // 2 days ago
      viewCount: 89,
      authorId: user2.id,
      categoryId: categories[1].id,
    },
  });

  const draftPost = await prisma.post.create({
    data: {
      title: "ReactのState管理について（下書き）",
      slug: "react-state-management-draft",
      content: "下書き中の記事です...",
      status: "DRAFT",
      authorId: user1.id,
      categoryId: categories[0].id,
    },
  });

  console.log("Created 4 posts");

  // Create Comments
  const comment1 = await prisma.comment.create({
    data: {
      content: "とても参考になりました！Next.js 15を早速試してみます。",
      authorId: user1.id,
      postId: post1.id,
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      content: "分かりやすい解説ありがとうございます。",
      authorId: user2.id,
      postId: post1.id,
    },
  });

  // Reply comment
  await prisma.comment.create({
    data: {
      content: "コメントありがとうございます！参考になったようで嬉しいです。",
      authorId: adminUser.id,
      postId: post1.id,
      parentId: comment1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Prismaは本当に便利ですね！",
      authorId: moderatorUser.id,
      postId: post2.id,
    },
  });

  console.log("Created 4 comments");

  // Create Likes
  await Promise.all([
    prisma.like.create({ data: { userId: user1.id, postId: post1.id } }),
    prisma.like.create({ data: { userId: user2.id, postId: post1.id } }),
    prisma.like.create({ data: { userId: moderatorUser.id, postId: post1.id } }),
    prisma.like.create({ data: { userId: adminUser.id, postId: post2.id } }),
    prisma.like.create({ data: { userId: user2.id, postId: post2.id } }),
    prisma.like.create({ data: { userId: user1.id, postId: post3.id } }),
  ]);
  console.log("Created 6 likes");

  // Create Bookmarks
  await Promise.all([
    prisma.bookmark.create({ data: { userId: user1.id, postId: post2.id } }),
    prisma.bookmark.create({ data: { userId: user2.id, postId: post1.id } }),
    prisma.bookmark.create({ data: { userId: moderatorUser.id, postId: post3.id } }),
  ]);
  console.log("Created 3 bookmarks");

  // Create Follows
  await Promise.all([
    prisma.follow.create({ data: { followerId: user1.id, followingId: adminUser.id } }),
    prisma.follow.create({ data: { followerId: user2.id, followingId: adminUser.id } }),
    prisma.follow.create({ data: { followerId: user2.id, followingId: user1.id } }),
    prisma.follow.create({ data: { followerId: moderatorUser.id, followingId: adminUser.id } }),
  ]);
  console.log("Created 4 follows");

  // Create Notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: adminUser.id,
        type: "LIKE",
        title: "いいねされました",
        message: "田中太郎さんがあなたの投稿にいいねしました。",
        link: `/posts/${post1.slug}`,
      },
    }),
    prisma.notification.create({
      data: {
        userId: adminUser.id,
        type: "COMMENT",
        title: "コメントがありました",
        message: "鈴木花子さんがあなたの投稿にコメントしました。",
        link: `/posts/${post1.slug}`,
      },
    }),
    prisma.notification.create({
      data: {
        userId: adminUser.id,
        type: "FOLLOW",
        title: "フォローされました",
        message: "田中太郎さんにフォローされました。",
        link: `/users/${user1.id}`,
      },
    }),
    prisma.notification.create({
      data: {
        userId: user1.id,
        type: "SYSTEM",
        title: "ようこそ！",
        message: "アカウント作成ありがとうございます。",
        isRead: true,
      },
    }),
  ]);
  console.log("Created 4 notifications");

  // Create Media
  await Promise.all([
    prisma.media.create({
      data: {
        filename: "nextjs-logo.png",
        mimeType: "image/png",
        size: 12345,
        url: "/uploads/nextjs-logo.png",
        alt: "Next.js Logo",
        postId: post1.id,
      },
    }),
    prisma.media.create({
      data: {
        filename: "prisma-diagram.svg",
        mimeType: "image/svg+xml",
        size: 8765,
        url: "/uploads/prisma-diagram.svg",
        alt: "Prisma Entity Diagram",
        postId: post2.id,
      },
    }),
  ]);
  console.log("Created 2 media");

  // Create Audit Logs
  await Promise.all([
    prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "CREATE",
        entity: "Post",
        entityId: post1.id,
        newValue: JSON.stringify({ title: post1.title }),
        ipAddress: "127.0.0.1",
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: user1.id,
        action: "LOGIN",
        entity: "User",
        entityId: user1.id,
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      },
    }),
  ]);
  console.log("Created 2 audit logs");

  console.log("\nDatabase seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
