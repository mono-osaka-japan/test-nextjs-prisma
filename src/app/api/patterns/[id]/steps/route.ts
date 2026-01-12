import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/patterns/[id]/steps - ステップ一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: patternId } = await params;

    const steps = await prisma.patternStep.findMany({
      where: { patternId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(steps);
  } catch (error) {
    console.error("Failed to fetch steps:", error);
    return NextResponse.json(
      { error: "Failed to fetch steps" },
      { status: 500 }
    );
  }
}

// POST /api/patterns/[id]/steps - ステップ作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: patternId } = await params;
    const body = await request.json();
    const { name, description, action, config, isEnabled = true } = body;

    if (!name || !action) {
      return NextResponse.json(
        { error: "Name and action are required" },
        { status: 400 }
      );
    }

    // Get max sortOrder
    const maxSortOrder = await prisma.patternStep.aggregate({
      where: { patternId },
      _max: { sortOrder: true },
    });

    const step = await prisma.patternStep.create({
      data: {
        name,
        description,
        action,
        config: JSON.stringify(config || {}),
        sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
        isEnabled,
        patternId,
      },
    });

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    console.error("Failed to create step:", error);
    return NextResponse.json(
      { error: "Failed to create step" },
      { status: 500 }
    );
  }
}

// PUT /api/patterns/[id]/steps - ステップ並び替え
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: patternId } = await params;
    const body = await request.json();
    const { stepIds } = body;

    if (!Array.isArray(stepIds)) {
      return NextResponse.json(
        { error: "stepIds array is required" },
        { status: 400 }
      );
    }

    // Update sortOrder for each step
    await prisma.$transaction(
      stepIds.map((stepId, index) =>
        prisma.patternStep.update({
          where: { id: stepId, patternId },
          data: { sortOrder: index },
        })
      )
    );

    const steps = await prisma.patternStep.findMany({
      where: { patternId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(steps);
  } catch (error) {
    console.error("Failed to reorder steps:", error);
    return NextResponse.json(
      { error: "Failed to reorder steps" },
      { status: 500 }
    );
  }
}
