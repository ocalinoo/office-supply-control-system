import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// Intent patterns untuk memahami pertanyaan user
const intentPatterns = {
  TOTAL_ITEMS: [/total\s+(barang|item|produk)/i, /ada\s+berapa\s+(barang|item)/i, /jumlah\s+barang/i],
  LOW_STOCK: [/stock\s+rendah/i, /stok\s+menipis/i, /low\s+stock/i, /barang\s+hampir\s+habis/i, /kurang\s+stock/i],
  CATEGORIES: [/kategori/i, /category/i, /jenis\s+barang/i, /macam\s+barang/i],
  ALL_ITEMS: [/semua\s+barang/i, /list\s+barang/i, /daftar\s+barang/i, /tampilkan\s+barang/i, /lihat\s+inventory/i],
  RECENT_ITEMS: [/baru/i, /recent/i, /ditambahkan/i, /added/i, /masuk/i],
  SEARCH: [/cari\s+/i, /search\s+/i, /nama\s+/i, /kode\s+/i, /sku\s+/i],
  STATS: [/statistik/i, /stats/i, /ringkasan/i, /summary/i, /overview/i],
  LOW_STOCK_DETAIL: [/detail\s+stock\s+rendah/i, /stock\s+rendah\s+detail/i],
  CATEGORY_ITEMS: [/barang\s+di\s+/i, /item\s+di\s+/i, /kategori\s+\w+/i],
  STOCK_VALUE: [/nilai\s+inventory/i, /stock\s+value/i, /total\s+stock/i],
};

// Template responses yang lebih natural
const responses = {
  TOTAL_ITEMS: (count: number) => `📦 Saat ini Anda memiliki **${count.toLocaleString()} barang** dalam inventaris. Ini adalah total semua item yang tercatat di sistem OSCS.`,
  NO_ITEMS: () => "📭 Belum ada barang dalam inventaris. Mulai tambahkan barang untuk mengelola stock Anda!",
  LOW_STOCK_EMPTY: () => "✅ Tidak ada barang dengan stock rendah. Semua barang memiliki stock yang cukup!",
  CATEGORIES_EMPTY: () => "📂 Belum ada kategori yang dibuat. Buat kategori untuk mengorganisir barang Anda!",
  ERROR: () => "⚠️ Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.",
  NOT_UNDERSTAND: () => `🤔 Maaf, saya belum memahami pertanyaan Anda. 

Saya bisa membantu dengan:
• **"Total barang"** - Lihat jumlah semua item
• **"Stock rendah"** - Barang yang perlu di-restock
• **"Kategori"** - Daftar kategori dan jumlah barang
• **"Semua barang"** - List lengkap inventory
• **"Barang baru"** - Item yang baru ditambahkan
• **"Cari [nama]"** - Cari barang berdasarkan nama/SKU
• **"Statistik"** - Ringkasan lengkap inventory
• **"Nilai inventory"** - Total quantity semua barang

Atau tanya dengan kalimat natural, contoh:
• "Ada berapa barang di gudang?"
• "Barang apa saja yang stocknya menipis?"
• "Tampilkan kategori yang ada"`,
};

// Helper function untuk extract search term
function extractSearchTerm(question: string): string | null {
  const searchPatterns = [
    /cari\s+(.+)/i,
    /search\s+(.+)/i,
    /nama\s+(.+)/i,
    /kode\s+(.+)/i,
    /sku\s+(.+)/i,
    /barang\s+bernama\s+(.+)/i,
  ];
  
  for (const pattern of searchPatterns) {
    const match = question.match(pattern);
    if (match && match[1]) {
      return match[1].trim().split(/[?.!]/)[0].trim(); // Clean trailing punctuation
    }
  }
  return null;
}

// Helper function untuk extract category name
function extractCategoryName(question: string): string | null {
  const patterns = [
    /barang\s+di\s+(.+)/i,
    /item\s+di\s+(.+)/i,
    /kategori\s+(.+)/i,
    /category\s+(.+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match && match[1]) {
      return match[1].trim().split(/[?.!]/)[0].trim();
    }
  }
  return null;
}

// Detect intent dari pertanyaan
function detectIntent(question: string): string | null {
  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(question)) {
        return intent;
      }
    }
  }
  return null;
}

// Format items menjadi chat message yang rapi
function formatItemsList(items: any[], title: string, maxItems = 10): string {
  if (items.length === 0) {
    return `📭 **${title}**: Tidak ada data`;
  }
  
  const displayItems = items.slice(0, maxItems);
  let message = `📦 **${title}** (${items.length} total):\n\n`;
  
  displayItems.forEach((item, index) => {
    const stockStatus = item.quantity <= item.minStock 
      ? "⚠️" 
      : item.quantity <= item.minStock * 1.5 
        ? "🟡" 
        : "✅";
    
    message += `${index + 1}. ${stockStatus} **${item.name}**\n`;
    message += `   └─ SKU: \`${item.sku}\` | Stock: ${item.quantity} ${item.unit}`;
    if (item.category) {
      message += ` | Kategori: ${item.category.name}`;
    }
    if (item.location) {
      message += ` | Lokasi: ${item.location}`;
    }
    message += "\n";
  });
  
  if (items.length > maxItems) {
    message += `\n... dan ${items.length - maxItems} barang lainnya`;
  }
  
  return message.trim();
}

// Format categories menjadi chat message
function formatCategories(categories: any[]): string {
  if (categories.length === 0) {
    return responses.CATEGORIES_EMPTY();
  }
  
  let message = "📂 **Kategori Barang**:\n\n";
  
  const sorted = categories.sort((a, b) => b.totalQuantity - a.totalQuantity);
  
  sorted.forEach((cat, index) => {
    const percentage = cat.totalQuantity > 0 
      ? `(${cat._count.items} item, ${(cat.totalQuantity).toLocaleString()} qty)`
      : `(0 item)`;
    message += `${index + 1}. **${cat.name}** ${percentage}\n`;
  });
  
  const totalItems = categories.reduce((sum, c) => sum + c._count.items, 0);
  const totalQty = categories.reduce((sum, c) => sum + c.totalQuantity, 0);
  message += `\n📊 **Total**: ${categories.length} kategori | ${totalItems.toLocaleString()} item | ${totalQty.toLocaleString()} quantity`;
  
  return message;
}

// Format low stock items
function formatLowStock(items: any[]): string {
  if (items.length === 0) {
    return responses.LOW_STOCK_EMPTY();
  }
  
  let message = `⚠️ **Barang Stock Rendah** (${items.length} item perlu perhatian):\n\n`;
  
  items.forEach((item, index) => {
    const shortage = item.minStock - item.quantity;
    const percentage = Math.round((item.quantity / item.minStock) * 100);
    message += `${index + 1}. **${item.name}**\n`;
    message += `   └─ Stock: ${item.quantity} / ${item.minStock} ${item.unit} (${percentage}%) ⚠️\n`;
    message += `   └─ Kekurangan: ${shortage} ${item.unit}\n`;
    if (item.category) {
      message += `   └─ Kategori: ${item.category.name}\n`;
    }
    if (item.location) {
      message += `   └─ Lokasi: ${item.location}\n`;
    }
  });
  
  return message.trim();
}

// Format statistics summary
function formatStats(stats: any): string {
  let message = "📊 **Ringkasan Inventory**\n\n";
  message += `• Total Item: **${stats.totalItems.toLocaleString()}** barang\n`;
  message += `• Total Quantity: **${stats.totalQuantity.toLocaleString()}** unit\n`;
  message += `• Kategori: **${stats.totalCategories}**\n`;
  message += `• Low Stock: **${stats.lowStock}** item ⚠️\n\n`;
  
  if (stats.lowStockItems && stats.lowStockItems.length > 0) {
    message += "🔴 **Perlu Segera Di-restock**:\n";
    stats.lowStockItems.slice(0, 5).forEach((item: any) => {
      message += `• ${item.name} (${item.quantity}/${item.minStock})\n`;
    });
  }
  
  return message;
}

export async function POST(request: NextRequest) {
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

    const { question, conversationHistory = [] } = await request.json();

    if (!question) {
      return NextResponse.json({ message: "Question required" }, { status: 400 });
    }

    const intent = detectIntent(question);
    let answer = "";
    let data: any = null;
    let displayData: any = null;

    switch (intent) {
      case "TOTAL_ITEMS": {
        const count = await prisma.item.count();
        answer = count > 0 ? responses.TOTAL_ITEMS(count) : responses.NO_ITEMS();
        data = { total: count };
        break;
      }

      case "LOW_STOCK":
      case "LOW_STOCK_DETAIL": {
        const allItems = await prisma.item.findMany({
          include: { category: true },
        });
        const lowStock = allItems
          .filter(item => item.quantity <= item.minStock)
          .sort((a, b) => a.quantity - b.quantity)
          .slice(0, 15);
        
        answer = formatLowStock(lowStock);
        data = lowStock;
        displayData = { type: "low_stock", items: lowStock };
        break;
      }

      case "CATEGORIES": {
        const categories = await prisma.category.findMany({
          include: {
            _count: { select: { items: true } },
            items: { select: { quantity: true } },
          },
        });
        
        const withTotalQty = categories.map(cat => ({
          ...cat,
          totalQuantity: cat.items.reduce((sum, item) => sum + item.quantity, 0),
        }));
        
        answer = formatCategories(withTotalQty);
        data = withTotalQty;
        break;
      }

      case "ALL_ITEMS": {
        const items = await prisma.item.findMany({
          include: { category: true },
          orderBy: { name: "asc" },
          take: 30,
        });
        answer = formatItemsList(items, "Daftar Barang", 30);
        data = items;
        break;
      }

      case "RECENT_ITEMS": {
        const recent = await prisma.item.findMany({
          include: { category: true },
          orderBy: { createdAt: "desc" },
          take: 15,
        });
        answer = formatItemsList(recent, "Barang Baru Ditambahkan", 15);
        data = recent;
        break;
      }

      case "SEARCH": {
        const searchTerm = extractSearchTerm(question);
        if (searchTerm) {
          const items = await prisma.item.findMany({
            where: {
              OR: [
                { name: { contains: searchTerm } },
                { sku: { contains: searchTerm } },
                { description: { contains: searchTerm } },
              ],
            },
            include: { category: true },
            take: 20,
          });
          
          if (items.length > 0) {
            answer = `🔍 **Hasil pencarian "${searchTerm}"**:\n\n` + 
                     formatItemsList(items, "", 20).replace("📦 **Daftar Barang**", "").trim();
          } else {
            answer = `🔍 Tidak ditemukan barang untuk "**${searchTerm}**".\n\nCoba kata kunci lain atau periksa ejaan.`;
          }
          data = items;
        } else {
          answer = "🔍 **Cari barang**\n\nSebutkan nama, SKU, atau kata kunci.\n\nContoh:\n• 'Cari kertas A4'\n• 'Cari SKU ABC123'\n• 'Nama laptop'";
        }
        break;
      }

      case "STATS": {
        const [totalItems, totalCategories, totalQuantityResult] = await Promise.all([
          prisma.item.count(),
          prisma.category.count(),
          prisma.item.aggregate({ _sum: { quantity: true } }),
        ]);
        
        const totalQuantity = totalQuantityResult._sum.quantity || 0;
        const allItems = await prisma.item.findMany({ include: { category: true } });
        const lowStockItems = allItems.filter(i => i.quantity <= i.minStock).slice(0, 10);
        
        const stats = {
          totalItems,
          totalCategories,
          totalQuantity,
          lowStock: lowStockItems.length,
          lowStockItems,
        };
        
        answer = formatStats(stats);
        data = stats;
        break;
      }

      case "CATEGORY_ITEMS": {
        const categoryName = extractCategoryName(question);
        if (categoryName) {
          const category = await prisma.category.findFirst({
            where: { name: { contains: categoryName } },
            include: {
              items: {
                include: { category: true },
                orderBy: { name: "asc" },
              },
            },
          });
          
          if (category) {
            answer = formatItemsList(category.items, `Barang di kategori "${category.name}"`, 20);
            data = category.items;
          } else {
            answer = `📂 Kategori "**${categoryName}**" tidak ditemukan.\n\nKategori yang ada:\n• Cleaning\n• Electronics\n• Furniture\n• dll`;
          }
        } else {
          answer = 'Sebutkan nama kategori. Contoh:\n• "Barang di kategori Electronics"\n• "Item di Furniture"';
        }
        break;
      }

      case "STOCK_VALUE": {
        const result = await prisma.item.aggregate({
          _sum: { quantity: true },
          _count: true,
        });
        const totalQty = result._sum.quantity || 0;
        answer = `📊 **Nilai Inventory**\n\n`;
        answer += `• Total Quantity: **${totalQty.toLocaleString()}** unit\n`;
        answer += `• Total Item: **${result._count}** SKU\n\n`;
        answer += `💡 *Ini adalah total quantity fisik barang, bukan nilai rupiah.*`;
        data = { totalQuantity: totalQty, totalItems: result._count };
        break;
      }

      default: {
        answer = responses.NOT_UNDERSTAND();
      }
    }

    // Save to database
    await prisma.aIChatMessage.create({
      data: {
        question,
        answer: answer.replace(/\*\*/g, "").replace(/`/g, ""), // Save plain text
      },
    });

    return NextResponse.json({ 
      answer, 
      data: displayData || data,
      intent,
    });
  } catch (error) {
    console.error("Assistant error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
