import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/patterns - パターン一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const isActive = searchParams.get("isActive");
    const campaignId = searchParams.get("campaignId");
    const systemGroupId = searchParams.get("systemGroupId");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (isActive !== null) where.isActive = isActive === "true";
    if (campaignId) where.campaignId = campaignId;
    if (systemGroupId) where.systemGroupId = systemGroupId;

    const patterns = await prisma.pattern.findMany({
      where,
      include: {
        campaign: true,
        systemGroup: true,
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(patterns);
  } catch (error) {
    console.error("Failed to fetch patterns:", error);
    return NextResponse.json(
      { error: "Failed to fetch patterns" },
      { status: 500 }
    );
  }
}

// POST /api/patterns - パターン作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, type, config, isActive, priority, campaignId, systemGroupId } = body;

    // バリデーション
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // campaignIdが指定されている場合、存在確認（空文字はnull扱い）
    const normalizedCampaignId = campaignId === "" ? null : campaignId;
    if (normalizedCampaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: normalizedCampaignId },
      });
      if (!campaign) {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 }
        );
      }
    }

    // systemGroupIdが指定されている場合、存在確認（空文字はnull扱い）
    const normalizedSystemGroupId = systemGroupId === "" ? null : systemGroupId;
    if (normalizedSystemGroupId) {
      const systemGroup = await prisma.systemGroup.findUnique({
        where: { id: normalizedSystemGroupId },
      });
      if (!systemGroup) {
        return NextResponse.json(
          { error: "SystemGroup not found" },
          { status: 404 }
        );
      }
    }

    // priorityの数値変換（0も許容）
    let parsedPriority = 0;
    if (priority !== undefined && priority !== null && priority !== "") {
      parsedPriority = parseInt(priority, 10);
      if (isNaN(parsedPriority)) {
        return NextResponse.json(
          { error: "priority must be a valid integer" },
          { status: 400 }
        );
      }
    }

    const pattern = await prisma.pattern.create({
      data: {
        name: name.trim(),
        description: description || null,
        type: type || "DEFAULT",
        config: config ? JSON.stringify(config) : null,
        isActive: isActive !== undefined ? isActive : true,
        priority: parsedPriority,
        campaignId: normalizedCampaignId || null,
        systemGroupId: normalizedSystemGroupId || null,
      },
      include: {
        campaign: true,
        systemGroup: true,
      },
    });

    return NextResponse.json(pattern, { status: 201 });
  } catch (error) {
    console.error("Failed to create pattern:", error);
    return NextResponse.json(
      { error: "Failed to create pattern" },
      { status: 500 }
    );
  }
}
