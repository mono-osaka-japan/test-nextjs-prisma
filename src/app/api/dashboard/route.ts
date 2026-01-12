import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    // KPI データの取得
    const [
      totalUsers,
      totalPosts,
      publishedPosts,
      totalComments,
      totalLikes,
      totalViews,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.post.count({ where: { status: 'PUBLISHED' } }),
      prisma.comment.count(),
      prisma.like.count(),
      prisma.post.aggregate({ _sum: { viewCount: true } }),
    ]);

    // 過去7日間のデータを取得
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentPosts, recentUsers] = await Promise.all([
      prisma.post.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
    ]);

    // チャート用データ（日別投稿数）
    const postsPerDay = await prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM Post
      WHERE createdAt >= ${sevenDaysAgo.toISOString()}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    // チャートデータを整形
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = postsPerDay.find((p) => p.date === dateStr);
      chartData.push({
        label: date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
        value: dayData ? Number(dayData.count) : 0,
      });
    }

    // KPIデータ
    const kpis = {
      totalUsers: {
        value: totalUsers,
        change: totalUsers > 0 ? Math.round((recentUsers / totalUsers) * 100) : 0,
        trend: recentUsers > 0 ? 'up' : 'neutral',
      },
      totalPosts: {
        value: totalPosts,
        change: totalPosts > 0 ? Math.round((recentPosts / totalPosts) * 100) : 0,
        trend: recentPosts > 0 ? 'up' : 'neutral',
      },
      publishedPosts: {
        value: publishedPosts,
      },
      totalComments: {
        value: totalComments,
      },
      totalLikes: {
        value: totalLikes,
      },
      totalViews: {
        value: totalViews._sum.viewCount || 0,
      },
    };

    return NextResponse.json({
      kpis,
      charts: {
        postsPerDay: chartData,
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
