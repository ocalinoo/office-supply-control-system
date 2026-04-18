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

    const versions = await prisma.versionHistory.findMany({
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
      take: 100,
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error("Versions error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
