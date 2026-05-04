import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all items with price info
    const allItems = await prisma.item.findMany({
      include: {
        category: true,
      },
    });

    const totalItems = allItems.length;
    const totalCategories = await prisma.category.count();
    const totalQuantity = allItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Calculate total cost of current stock
    const totalCostStock = allItems.reduce((sum, item) => {
      return sum + ((item.price || 0) * item.quantity);
    }, 0);

    const lowStockItems = allItems.filter(item => item.quantity <= item.minStock).slice(0, 10);

    // Calculate today's outcome (OUT logs today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLogs = await prisma.inventoryLog.findMany({
      where: {
        action: "OUT",
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        item: true,
      },
    });

    const todayOutcome = todayLogs.reduce((sum, log) => {
      return sum + ((log.item.price || 0) * log.quantity);
    }, 0);

    return NextResponse.json({
      totalItems,
      totalCategories,
      totalQuantity,
      totalCostStock,
      todayOutcome,
      lowStock: lowStockItems.length,
      lowStockItems,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengambil stats" },
      { status: 500 }
    );
  }
}
