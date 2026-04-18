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

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");

    let where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Inventory error:", error);
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

    const data = await request.json();

    console.log("Creating item with data:", data);

    // Check if SKU already exists
    const existingItem = await prisma.item.findUnique({
      where: { sku: data.sku },
    });

    if (existingItem) {
      return NextResponse.json(
        { message: `SKU '${data.sku}' sudah ada. Gunakan SKU yang berbeda atau update item yang sudah ada.` },
        { status: 400 }
      );
    }

    const item = await prisma.item.create({
      data: {
        name: data.name,
        sku: data.sku,
        categoryId: data.categoryId,
        quantity: data.quantity || 0,
        minStock: data.minStock || 10,
        unit: data.unit || "pcs",
        location: data.location,
        description: data.description,
      },
      include: {
        category: true,
      },
    });

    console.log("Item created successfully:", item);

    return NextResponse.json(item);
  } catch (error) {
    console.error("Create item error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Terjadi kesalahan: " + errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const { id, ...data } = await request.json();

    // Get old values for version history
    const oldItem = await prisma.item.findUnique({
      where: { id },
    });

    if (!oldItem) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    const changes: string[] = [];
    if (data.name && data.name !== oldItem.name) changes.push(`Name: ${oldItem.name} → ${data.name}`);
    if (data.quantity !== undefined && data.quantity !== oldItem.quantity) changes.push(`Quantity: ${oldItem.quantity} → ${data.quantity}`);
    if (data.minStock && data.minStock !== oldItem.minStock) changes.push(`Min Stock: ${oldItem.minStock} → ${data.minStock}`);

    const item = await prisma.item.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });

    // Create version history and inventory log
    if (changes.length > 0) {
      await prisma.versionHistory.create({
        data: {
          itemId: id,
          changes: changes.join(", "),
          changedBy: payload.username,
          snapshot: JSON.stringify(oldItem),
        },
      });

      // Create inventory log with correct action for quantity changes
      if (data.quantity !== undefined && data.quantity !== oldItem.quantity) {
        const qtyDiff = data.quantity - oldItem.quantity;
        let action = "ADJUSTMENT";
        if (qtyDiff < 0) {
          action = "OUT";
        } else if (qtyDiff > 0) {
          action = "IN";
        }

        await prisma.inventoryLog.create({
          data: {
            itemId: id,
            action,
            quantity: Math.abs(qtyDiff),
            previous: oldItem.quantity,
          },
        });
      }
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Update item error:", error);
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

    console.log("Deleting item with ID:", id);

    // First check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json({ message: "Item tidak ditemukan" }, { status: 404 });
    }

    // Delete related logs and versions first to avoid foreign key issues
    await prisma.inventoryLog.deleteMany({
      where: { itemId: id },
    });

    await prisma.versionHistory.deleteMany({
      where: { itemId: id },
    });

    // Then delete the item
    await prisma.item.delete({
      where: { id },
    });

    console.log("Item deleted successfully:", id);

    return NextResponse.json({ message: "Item deleted" });
  } catch (error) {
    console.error("Delete item error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Terjadi kesalahan", error: errorMessage },
      { status: 500 }
    );
  }
}
