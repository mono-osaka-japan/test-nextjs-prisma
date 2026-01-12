import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/patterns/[id] - パターン詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const pattern = await prisma.pattern.findUnique({
      where: { id },
      include: {
<<<<<<< HEAD
        steps: {
          orderBy: { sortOrder: "asc" },
        },
        author: {
          select: { id: true, name: true, email: true },
        },
        testResults: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
=======
        campaign: true,
        systemGroup: true,
>>>>>>> origin/main
      },
    });

    if (!pattern) {
      return NextResponse.json(
        { error: "Pattern not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(pattern);
  } catch (error) {
    console.error("Failed to fetch pattern:", error);
    return NextResponse.json(
      { error: "Failed to fetch pattern" },
      { status: 500 }
    );
  }
}

// PUT /api/patterns/[id] - パターン更新
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
<<<<<<< HEAD
    const { name, description, isActive } = body;
=======
    const { name, description, type, config, isActive, priority, campaignId, systemGroupId } = body;

    // 存在確認
    const existing = await prisma.pattern.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Pattern not found" },
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

    // priorityの数値変換（0も許容、空文字/nullは未指定扱い）
    let parsedPriority: number | undefined = undefined;
    if (priority !== undefined && priority !== null && priority !== "") {
      parsedPriority = parseInt(priority, 10);
      if (isNaN(parsedPriority)) {
        return NextResponse.json(
          { error: "priority must be a valid integer" },
          { status: 400 }
        );
      }
    }
>>>>>>> origin/main

    const pattern = await prisma.pattern.update({
      where: { id },
      data: {
<<<<<<< HEAD
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        steps: {
          orderBy: { sortOrder: "asc" },
        },
        author: {
          select: { id: true, name: true, email: true },
        },
=======
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(config !== undefined && { config: config ? JSON.stringify(config) : null }),
        ...(isActive !== undefined && { isActive }),
        ...(parsedPriority !== undefined && { priority: parsedPriority }),
        ...(campaignId !== undefined && { campaignId: normalizedCampaignId }),
        ...(systemGroupId !== undefined && { systemGroupId: normalizedSystemGroupId }),
      },
      include: {
        campaign: true,
        systemGroup: true,
>>>>>>> origin/main
      },
    });

    return NextResponse.json(pattern);
  } catch (error) {
    console.error("Failed to update pattern:", error);
    return NextResponse.json(
      { error: "Failed to update pattern" },
      { status: 500 }
    );
  }
}

// DELETE /api/patterns/[id] - パターン削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

<<<<<<< HEAD
=======
    // 存在確認
    const existing = await prisma.pattern.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Pattern not found" },
        { status: 404 }
      );
    }

>>>>>>> origin/main
    await prisma.pattern.delete({
      where: { id },
    });

<<<<<<< HEAD
    return NextResponse.json({ success: true });
=======
    return NextResponse.json({ message: "Pattern deleted successfully" });
>>>>>>> origin/main
  } catch (error) {
    console.error("Failed to delete pattern:", error);
    return NextResponse.json(
      { error: "Failed to delete pattern" },
      { status: 500 }
    );
  }
}
