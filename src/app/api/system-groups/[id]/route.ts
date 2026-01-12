import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/system-groups/[id] - システムグループ詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const systemGroup = await prisma.systemGroup.findUnique({
      where: { id },
      include: {
        patterns: true,
      },
    });

    if (!systemGroup) {
      return NextResponse.json(
        { error: "SystemGroup not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(systemGroup);
  } catch (error) {
    console.error("Failed to fetch system group:", error);
    return NextResponse.json(
      { error: "Failed to fetch system group" },
      { status: 500 }
    );
  }
}

// PUT /api/system-groups/[id] - システムグループ更新
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, sortOrder, isActive } = body;

    // 存在確認
    const existing = await prisma.systemGroup.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "SystemGroup not found" },
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

    // 名前の重複チェック（自分以外）
    if (name !== undefined && name.trim() !== existing.name) {
      const duplicate = await prisma.systemGroup.findUnique({
        where: { name: name.trim() },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "SystemGroup with this name already exists" },
          { status: 400 }
        );
      }
    }

    const systemGroup = await prisma.systemGroup.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder, 10) }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        patterns: true,
      },
    });

    return NextResponse.json(systemGroup);
  } catch (error) {
    console.error("Failed to update system group:", error);
    return NextResponse.json(
      { error: "Failed to update system group" },
      { status: 500 }
    );
  }
}

// DELETE /api/system-groups/[id] - システムグループ削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 存在確認
    const existing = await prisma.systemGroup.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "SystemGroup not found" },
        { status: 404 }
      );
    }

    await prisma.systemGroup.delete({
      where: { id },
    });

    return NextResponse.json({ message: "SystemGroup deleted successfully" });
  } catch (error) {
    console.error("Failed to delete system group:", error);
    return NextResponse.json(
      { error: "Failed to delete system group" },
      { status: 500 }
    );
  }
}
