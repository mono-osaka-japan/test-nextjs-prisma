import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/patterns - パターン一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const authorId = searchParams.get("authorId");
    const isActive = searchParams.get("isActive");

    const patterns = await prisma.pattern.findMany({
      where: {
        ...(authorId && { authorId }),
        ...(isActive !== null && { isActive: isActive === "true" }),
      },
      include: {
        steps: {
          orderBy: { sortOrder: "asc" },
        },
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
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
    const { name, description, isActive = true, authorId } = body;

    if (!name || !authorId) {
      return NextResponse.json(
        { error: "Name and authorId are required" },
        { status: 400 }
      );
    }

    const pattern = await prisma.pattern.create({
      data: {
        name,
        description,
        isActive,
        authorId,
      },
      include: {
        steps: true,
        author: {
          select: { id: true, name: true, email: true },
        },
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
