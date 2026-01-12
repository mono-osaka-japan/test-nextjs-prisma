import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/dashboard - ダッシュボード統計情報取得
export async function GET() {
  try {
    // 全体統計を並列で取得
    const [
      totalCampaigns,
      totalPatterns,
      totalSystemGroups,
      activeCampaigns,
      activePatterns,
      activeSystemGroups,
      campaignsByStatus,
      patternsByType,
      recentCampaigns,
      recentPatterns,
    ] = await Promise.all([
      // 総数
      prisma.campaign.count(),
      prisma.pattern.count(),
      prisma.systemGroup.count(),

      // アクティブ数
      prisma.campaign.count({ where: { status: "ACTIVE" } }),
      prisma.pattern.count({ where: { isActive: true } }),
      prisma.systemGroup.count({ where: { isActive: true } }),

      // キャンペーンのステータス別集計
      prisma.campaign.groupBy({
        by: ["status"],
        _count: { status: true },
      }),

      // パターンのタイプ別集計
      prisma.pattern.groupBy({
        by: ["type"],
        _count: { type: true },
      }),

      // 最近の案件
      prisma.campaign.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { patterns: true } },
        },
      }),

      // 最近のパターン
      prisma.pattern.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          campaign: true,
          systemGroup: true,
        },
      }),
    ]);

    // ステータス別・タイプ別をオブジェクトに変換
    const campaignStatusCounts: Record<string, number> = {};
    for (const item of campaignsByStatus) {
      campaignStatusCounts[item.status] = item._count.status;
    }

    const patternTypeCounts: Record<string, number> = {};
    for (const item of patternsByType) {
      patternTypeCounts[item.type] = item._count.type;
    }

    const dashboard = {
      summary: {
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns,
          byStatus: campaignStatusCounts,
        },
        patterns: {
          total: totalPatterns,
          active: activePatterns,
          byType: patternTypeCounts,
        },
        systemGroups: {
          total: totalSystemGroups,
          active: activeSystemGroups,
        },
      },
      recent: {
        campaigns: recentCampaigns.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          patternCount: c._count.patterns,
          createdAt: c.createdAt,
        })),
        patterns: recentPatterns.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          isActive: p.isActive,
          campaign: p.campaign?.name || null,
          systemGroup: p.systemGroup?.name || null,
          createdAt: p.createdAt,
        })),
      },
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
