import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/campaigns - 案件一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const systemGroupId = searchParams.get("systemGroupId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (systemGroupId) where.systemGroupId = systemGroupId;

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        systemGroup: true,
        patterns: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - 案件作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, status, startDate, endDate, budget, targetMetrics, systemGroupId } = body;

    // バリデーション
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (status && !["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED" },
        { status: 400 }
      );
    }

    // systemGroupIdが指定されている場合、存在確認
    if (systemGroupId) {
      const systemGroup = await prisma.systemGroup.findUnique({
        where: { id: systemGroupId },
      });
      if (!systemGroup) {
        return NextResponse.json(
          { error: "SystemGroup not found" },
          { status: 404 }
        );
      }
    }

    // budgetの数値変換（0も許容）
    let parsedBudget: number | null = null;
    if (budget !== undefined && budget !== null && budget !== "") {
      parsedBudget = parseFloat(budget);
      if (isNaN(parsedBudget)) {
        return NextResponse.json(
          { error: "budget must be a valid number" },
          { status: 400 }
        );
      }
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        description: description || null,
        status: status || "DRAFT",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: parsedBudget,
        targetMetrics: targetMetrics ? JSON.stringify(targetMetrics) : null,
        systemGroupId: systemGroupId || null,
      },
      include: {
        systemGroup: true,
        patterns: true,
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Failed to create campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
