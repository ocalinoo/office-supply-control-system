import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalItems, totalCategories, totalQuantityResult] =
      await Promise.all([
        prisma.item.count(),
        prisma.category.count(),
        prisma.item.aggregate({
          _sum: { quantity: true },
        }),
      ]);

    const totalQuantity = totalQuantityResult._sum.quantity || 0;

    // Get all items and filter for low stock
    const allItems = await prisma.item.findMany({
      include: {
        category: true,
      },
    });

    const lowStockItems = allItems.filter(item => item.quantity <= item.minStock).slice(0, 10);

    return NextResponse.json({
      totalItems,
      totalCategories,
      totalQuantity,
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
