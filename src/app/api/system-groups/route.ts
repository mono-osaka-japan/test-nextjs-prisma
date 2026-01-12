import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/system-groups - システムグループ一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {};
    if (isActive !== null) where.isActive = isActive === "true";

    const systemGroups = await prisma.systemGroup.findMany({
      where,
      include: {
        campaigns: true,
        patterns: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(systemGroups);
  } catch (error) {
    console.error("Failed to fetch system groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch system groups" },
      { status: 500 }
    );
  }
}

// POST /api/system-groups - システムグループ作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, sortOrder, isActive } = body;

    // バリデーション
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // 重複チェック
    const existing = await prisma.systemGroup.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "SystemGroup with this name already exists" },
        { status: 400 }
      );
    }

    const systemGroup = await prisma.systemGroup.create({
      data: {
        name: name.trim(),
        description: description || null,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder, 10) : 0,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        campaigns: true,
        patterns: true,
      },
    });

    return NextResponse.json(systemGroup, { status: 201 });
  } catch (error) {
    console.error("Failed to create system group:", error);
    return NextResponse.json(
      { error: "Failed to create system group" },
      { status: 500 }
    );
  }
}
