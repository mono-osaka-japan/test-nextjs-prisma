import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type RouteParams = { params: Promise<{ id: string; stepId: string }> };

// GET /api/patterns/[id]/steps/[stepId] - ステップ詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: patternId, stepId } = await params;

    const step = await prisma.patternStep.findFirst({
      where: { id: stepId, patternId },
    });

    if (!step) {
      return NextResponse.json(
        { error: "Step not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(step);
  } catch (error) {
    console.error("Failed to fetch step:", error);
    return NextResponse.json(
      { error: "Failed to fetch step" },
      { status: 500 }
    );
  }
}

// PUT /api/patterns/[id]/steps/[stepId] - ステップ更新
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: patternId, stepId } = await params;
    const body = await request.json();
    const { name, description, action, config, sortOrder, isEnabled } = body;

    const step = await prisma.patternStep.update({
      where: { id: stepId, patternId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(action !== undefined && { action }),
        ...(config !== undefined && { config: JSON.stringify(config) }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isEnabled !== undefined && { isEnabled }),
      },
    });

    return NextResponse.json(step);
  } catch (error) {
    console.error("Failed to update step:", error);
    return NextResponse.json(
      { error: "Failed to update step" },
      { status: 500 }
    );
  }
}

// DELETE /api/patterns/[id]/steps/[stepId] - ステップ削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: patternId, stepId } = await params;

    await prisma.patternStep.delete({
      where: { id: stepId, patternId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete step:", error);
    return NextResponse.json(
      { error: "Failed to delete step" },
      { status: 500 }
    );
  }
}
