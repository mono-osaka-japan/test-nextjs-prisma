import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/campaigns/[id] - 案件詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        systemGroup: true,
        patterns: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Failed to fetch campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

// PUT /api/campaigns/[id] - 案件更新
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, status, startDate, endDate, budget, targetMetrics, systemGroupId } = body;

    // 存在確認
    const existing = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // バリデーション
    if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
      return NextResponse.json(
        { error: "name must be a non-empty string" },
        { status: 400 }
      );
    }

    if (status && !["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED" },
        { status: 400 }
      );
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

    // budgetの数値変換（0も許容）
    let parsedBudget: number | null | undefined = undefined;
    if (budget !== undefined) {
      if (budget === null || budget === "") {
        parsedBudget = null;
      } else {
        parsedBudget = parseFloat(budget);
        if (isNaN(parsedBudget)) {
          return NextResponse.json(
            { error: "budget must be a valid number" },
            { status: 400 }
          );
        }
      }
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(parsedBudget !== undefined && { budget: parsedBudget }),
        ...(targetMetrics !== undefined && { targetMetrics: targetMetrics ? JSON.stringify(targetMetrics) : null }),
        ...(systemGroupId !== undefined && { systemGroupId: normalizedSystemGroupId }),
      },
      include: {
        systemGroup: true,
        patterns: true,
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Failed to update campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

// DELETE /api/campaigns/[id] - 案件削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 存在確認
    const existing = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    await prisma.campaign.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Failed to delete campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
