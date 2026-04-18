import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const data = await request.json();

    // Get old values for version history
    const oldItem = await prisma.item.findUnique({
      where: { id },
    });

    if (!oldItem) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    // Build changes array for logging
    const changes: string[] = [];
    if (data.quantity !== undefined && data.quantity !== oldItem.quantity) {
      changes.push(`Quantity: ${oldItem.quantity} → ${data.quantity}`);
    }
    if (data.minStock !== undefined && data.minStock !== oldItem.minStock) {
      changes.push(`Min Stock: ${oldItem.minStock} → ${data.minStock}`);
    }
    if (data.name && data.name !== oldItem.name) {
      changes.push(`Name: ${oldItem.name} → ${data.name}`);
    }
    if (data.location && data.location !== oldItem.location) {
      changes.push(`Location: ${oldItem.location} → ${data.location}`);
    }

    // Update the item
    const item = await prisma.item.update({
      where: { id },
      data: {
        quantity: data.quantity !== undefined ? data.quantity : oldItem.quantity,
        minStock: data.minStock !== undefined ? data.minStock : oldItem.minStock,
        name: data.name ?? oldItem.name,
        location: data.location ?? oldItem.location,
      },
      include: {
        category: true,
      },
    });

    // Create version history if there are changes
    if (changes.length > 0) {
      await prisma.versionHistory.create({
        data: {
          itemId: id,
          changes: changes.join(", "),
          changedBy: payload.username || "Unknown",
          snapshot: JSON.stringify(oldItem),
        },
      });

      // Create inventory log with correct action
      const newQty = data.quantity !== undefined ? data.quantity : oldItem.quantity;
      const qtyDiff = newQty - oldItem.quantity;
      
      let action = "ADJUSTMENT";
      if (qtyDiff < 0) {
        action = "OUT"; // Stock decreased
      } else if (qtyDiff > 0) {
        action = "IN"; // Stock increased
      }

      await prisma.inventoryLog.create({
        data: {
          itemId: id,
          action,
          quantity: Math.abs(qtyDiff), // Record the absolute change amount
          previous: oldItem.quantity,
        },
      });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("PATCH item error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Terjadi kesalahan: " + errorMessage },
      { status: 500 }
    );
  }
}
