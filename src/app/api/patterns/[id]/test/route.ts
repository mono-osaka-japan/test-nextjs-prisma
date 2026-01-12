import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/patterns/[id]/test - テスト実行
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: patternId } = await params;
    const body = await request.json();
    const { input = {} } = body;

    // Get pattern with steps
    const pattern = await prisma.pattern.findUnique({
      where: { id: patternId },
      include: {
        steps: {
          where: { isEnabled: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!pattern) {
      return NextResponse.json(
        { error: "Pattern not found" },
        { status: 404 }
      );
    }

    // Create test result record
    const testResult = await prisma.patternTestResult.create({
      data: {
        patternId,
        status: "RUNNING",
        input: JSON.stringify(input),
      },
    });

    const startTime = Date.now();

    try {
      // Execute steps (simulated)
      const output: Record<string, unknown> = { input };
      const stepResults: Array<{ stepId: string; name: string; success: boolean; result?: unknown; error?: string }> = [];

      for (const step of pattern.steps) {
        const stepConfig = JSON.parse(step.config);
        const stepResult = await executeStep(step.action, stepConfig, output);

        stepResults.push({
          stepId: step.id,
          name: step.name,
          success: stepResult.success,
          result: stepResult.result,
          error: stepResult.error,
        });

        if (!stepResult.success) {
          throw new Error(`Step "${step.name}" failed: ${stepResult.error}`);
        }

        output[`step_${step.sortOrder}`] = stepResult.result;
      }

      const duration = Date.now() - startTime;

      // Update test result
      const updatedResult = await prisma.patternTestResult.update({
        where: { id: testResult.id },
        data: {
          status: "SUCCESS",
          output: JSON.stringify({ stepResults, finalOutput: output }),
          duration,
        },
      });

      return NextResponse.json(updatedResult);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      const updatedResult = await prisma.patternTestResult.update({
        where: { id: testResult.id },
        data: {
          status: "FAILED",
          error: errorMessage,
          duration,
        },
      });

      return NextResponse.json(updatedResult);
    }
  } catch (error) {
    console.error("Failed to run test:", error);
    return NextResponse.json(
      { error: "Failed to run test" },
      { status: 500 }
    );
  }
}

// GET /api/patterns/[id]/test - テスト結果一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: patternId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");

    const results = await prisma.patternTestResult.findMany({
      where: { patternId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to fetch test results:", error);
    return NextResponse.json(
      { error: "Failed to fetch test results" },
      { status: 500 }
    );
  }
}

// Step execution simulator
async function executeStep(
  action: string,
  config: Record<string, unknown>,
  context: Record<string, unknown>
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  switch (action) {
    case "NOTIFY":
      return {
        success: true,
        result: { notified: true, message: config.message || "Notification sent" },
      };

    case "VALIDATE":
      const fieldToValidate = config.field as string;
      const value = context.input && typeof context.input === 'object'
        ? (context.input as Record<string, unknown>)[fieldToValidate]
        : undefined;

      if (config.required && !value) {
        return { success: false, error: `Field "${fieldToValidate}" is required` };
      }
      return { success: true, result: { validated: true, field: fieldToValidate } };

    case "TRANSFORM":
      return {
        success: true,
        result: { transformed: true, config },
      };

    case "WEBHOOK":
      return {
        success: true,
        result: { webhookCalled: true, url: config.url },
      };

    case "CONDITION":
      return {
        success: true,
        result: { conditionMet: true },
      };

    case "DELAY":
      const delayMs = (config.delayMs as number) || 1000;
      await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 5000)));
      return {
        success: true,
        result: { delayed: true, ms: delayMs },
      };

    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
}
