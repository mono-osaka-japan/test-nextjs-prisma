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
    const { name, description, isActive } = body;

    const pattern = await prisma.pattern.update({
      where: { id },
      data: {
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

    await prisma.pattern.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete pattern:", error);
    return NextResponse.json(
      { error: "Failed to delete pattern" },
      { status: 500 }
    );
  }
}
