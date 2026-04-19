import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

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

    const searchParams = request.nextUrl.searchParams;
    const includeEmpty = searchParams.get("includeEmpty") === "true";

    let categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { items: true },
        },
        items: {
          select: {
            quantity: true,
          },
        },
      },
    });

    // Calculate total quantity per category
    const categoriesWithQty = categories.map(cat => ({
      ...cat,
      totalQuantity: cat.items.reduce((sum, item) => sum + item.quantity, 0),
    }));

    // Filter out empty categories unless includeEmpty is true
    let filteredCategories = categoriesWithQty;
    if (!includeEmpty) {
      filteredCategories = categoriesWithQty.filter(cat => cat._count.items > 0);
    }

    return NextResponse.json(filteredCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      _count: cat._count,
      totalQuantity: cat.totalQuantity,
    })));
  } catch (error) {
    console.error("Categories error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const { name, color } = await request.json();

    const category = await prisma.category.create({
      data: { name, color: color || "#3b82f6" },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID diperlukan" }, { status: 400 });
    }

    // Check if category has items
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ message: "Kategori tidak ditemukan" }, { status: 404 });
    }

    if (category._count.items > 0) {
      return NextResponse.json(
        { message: "Kategori masih memiliki item. Hapus atau pindahkan item terlebih dahulu." },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Kategori dihapus" });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
