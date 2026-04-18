import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create Admin User
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      role: "ADMIN",
      name: "Administrator",
    },
  });
  console.log("✅ Created admin user");

  // Create User
  const userPassword = await bcrypt.hash("user123", 12);
  const user = await prisma.user.upsert({
    where: { username: "user" },
    update: {},
    create: {
      username: "user",
      password: userPassword,
      role: "USER",
      name: "Staff User",
    },
  });
  console.log("✅ Created user");

  // Create Categories
  const categories = [
    { name: "Stationery", color: "#3b82f6" },
    { name: "Electronics", color: "#10b981" },
    { name: "Furniture", color: "#f59e0b" },
    { name: "Office Supplies", color: "#ef4444" },
    { name: "Cleaning", color: "#8b5cf6" },
    { name: "IT Equipment", color: "#06b6d4" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log("✅ Created categories");

  // Get categories for items
  const stationery = await prisma.category.findUnique({ where: { name: "Stationery" } });
  const electronics = await prisma.category.findUnique({ where: { name: "Electronics" } });
  const officeSupplies = await prisma.category.findUnique({ where: { name: "Office Supplies" } });
  const itEquipment = await prisma.category.findUnique({ where: { name: "IT Equipment" } });

  // Create Sample Items
  const items = [
    {
      name: "Kertas A4",
      sku: "STAT-001",
      categoryId: stationery?.id || "",
      quantity: 50,
      minStock: 20,
      unit: "rim",
      location: "Rak A1",
      description: "Kertas HVS 80gsm",
    },
    {
      name: "Pulpen Blue",
      sku: "STAT-002",
      categoryId: stationery?.id || "",
      quantity: 100,
      minStock: 30,
      unit: "pcs",
      location: "Rak A2",
      description: "Pulpen biru standar",
    },
    {
      name: "Mouse Wireless",
      sku: "IT-001",
      categoryId: itEquipment?.id || "",
      quantity: 15,
      minStock: 5,
      unit: "pcs",
      location: "Rak B1",
      description: "Mouse wireless Logitech",
    },
    {
      name: "Keyboard Mechanical",
      sku: "IT-002",
      categoryId: itEquipment?.id || "",
      quantity: 10,
      minStock: 5,
      unit: "pcs",
      location: "Rak B1",
      description: "Keyboard mechanical RGB",
    },
    {
      name: "Monitor 24 inch",
      sku: "IT-003",
      categoryId: itEquipment?.id || "",
      quantity: 8,
      minStock: 3,
      unit: "pcs",
      location: "Rak B2",
      description: "Monitor LED Full HD",
    },
    {
      name: "Stapler",
      sku: "STAT-003",
      categoryId: stationery?.id || "",
      quantity: 25,
      minStock: 10,
      unit: "pcs",
      location: "Rak A3",
      description: "Stapler besar",
    },
    {
      name: "Tinta Printer",
      sku: "STAT-004",
      categoryId: stationery?.id || "",
      quantity: 12,
      minStock: 5,
      unit: "pcs",
      location: "Rak A4",
      description: "Tinta printer hitam",
    },
    {
      name: "Folder Map",
      sku: "OFF-001",
      categoryId: officeSupplies?.id || "",
      quantity: 200,
      minStock: 50,
      unit: "pcs",
      location: "Rak C1",
      description: "Folder map kuning",
    },
    {
      name: "Extension Cable",
      sku: "IT-004",
      categoryId: itEquipment?.id || "",
      quantity: 20,
      minStock: 10,
      unit: "pcs",
      location: "Rak B3",
      description: "Extension 5 meter",
    },
    {
      name: "USB Flashdisk 32GB",
      sku: "IT-005",
      categoryId: itEquipment?.id || "",
      quantity: 30,
      minStock: 10,
      unit: "pcs",
      location: "Rak B3",
      description: "Flashdisk SanDisk",
    },
  ];

  for (const item of items) {
    await prisma.item.create({
      data: item,
    });
  }
  console.log("✅ Created sample items");

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
