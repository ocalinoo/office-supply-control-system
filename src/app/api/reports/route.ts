import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "DAILY";

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (type) {
      case "WEEKLY":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case "MONTHLY":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      default:
        startDate = startOfDay(now);
        endDate = endOfDay(now);
    }

    // Count OUT logs per item within the selected period
    // Get all OUT logs first
    const outLogs = await prisma.inventoryLog.findMany({
      where: {
        action: "OUT",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        item: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group by itemId and count occurrences + total quantity
    const logMap = new Map<string, { count: number; totalQuantity: number; item: any }>();

    for (const log of outLogs) {
      const existing = logMap.get(log.itemId);
      if (existing) {
        existing.count++;
        existing.totalQuantity += log.quantity;
      } else {
        logMap.set(log.itemId, {
          count: 1,
          totalQuantity: log.quantity,
          item: log.item,
        });
      }
    }

    // Convert to array and sort by total quantity (most consumed first)
    // Return ALL items that have OUT logs (not just top 5)
    const allItems = Array.from(logMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .map(({ item, count, totalQuantity }) => ({
        ...item,
        _count: {
          logs: count,
          totalOut: totalQuantity,
        },
      }));

    // Calculate total cost for the period
    const totalCost = Array.from(logMap.values()).reduce((sum, { item, totalQuantity }) => {
      return sum + ((item.price || 0) * totalQuantity);
    }, 0);

    return NextResponse.json({
      type,
      period: `${startDate.toISOString()} - ${endDate.toISOString()}`,
      top5: allItems, // Return all items (top5 is now all items with OUT logs)
      totalCost,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
