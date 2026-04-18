import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

// This endpoint is called by Cloudflare Cron Trigger at 22:00 WIB daily
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if provided
    const cronSecret = request.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;
    
    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const today = startOfDay(now);
    const endToday = endOfDay(now);

    // Get all changes made today
    const todayVersions = await prisma.versionHistory.findMany({
      where: {
        changedAt: {
          gte: today,
          lte: endToday,
        },
      },
      include: {
        item: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
      orderBy: {
        changedAt: "desc",
      },
    });

    // Get items with low stock
    const lowStockItems = await prisma.item.findMany({
      where: {
        quantity: {
          lte: prisma.item.fields.minStock,
        },
      },
      include: {
        category: true,
      },
    });

    // Get inventory logs for today
    const todayLogs = await prisma.inventoryLog.findMany({
      where: {
        createdAt: {
          gte: today,
          lte: endToday,
        },
      },
      include: {
        item: true,
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    // Create highlight report
    const highlightData = {
      date: now.toISOString(),
      totalChanges: todayVersions.length,
      lowStockCount: lowStockItems.length,
      totalTransactions: todayLogs.length,
      changes: todayVersions.map((v) => ({
        item: v.item.name,
        sku: v.item.sku,
        changes: v.changes,
        changedBy: v.changedBy,
        time: v.changedAt,
      })),
      lowStock: lowStockItems.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        minStock: i.minStock,
        category: i.category.name,
      })),
    };

    // Save report to database
    const report = await prisma.report.create({
      data: {
        type: "HIGHLIGHT",
        period: today.toISOString(),
        data: JSON.stringify(highlightData),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Daily highlight report generated",
      reportId: report.id,
      summary: {
        totalChanges: todayVersions.length,
        lowStockCount: lowStockItems.length,
        totalTransactions: todayLogs.length,
      },
    });
  } catch (error) {
    console.error("Auto report error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat generate report" },
      { status: 500 }
    );
  }
}
