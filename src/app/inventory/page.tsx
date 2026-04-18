"use client";

import DashboardLayout from "@/components/DashboardLayout";
import BarcodeScanner from "@/components/BarcodeScanner";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import toast from "react-hot-toast";
import {
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  QrCode,
  Search,
  Filter,
  Eye,
  EyeOff,
  Camera,
  Package,
} from "lucide-react";
import QRCode from "qrcode.react";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

interface FulfilledResult {
  status: "fulfilled";
  value: { type: "created" | "updated" };
}

interface Item {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minStock: number;
  unit: string;
  location: string | null;
  description: string | null;
  category: {
    id: string;
    name: string;
    color: string;
  };
}

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function InventoryPage() {
  const { user, token } = useAppStore();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrItem, setQrItem] = useState<Item | null>(null);
  const [qrQty, setQrQty] = useState<number>(0);
  const [showScanner, setShowScanner] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [createNewCategory, setCreateNewCategory] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    categoryId: "",
    quantity: 0,
    minStock: 10,
    unit: "pcs",
    location: "",
    description: "",
  });

  const isAdmin = user?.role === "ADMIN";

  const fetchItems = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory) params.append("categoryId", selectedCategory);

      console.log("Fetching items with token:", token ? "present" : "missing");

      const res = await fetch(`/api/inventory?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Fetch items response status:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("Fetched items count:", data.length);
        console.log("First item:", data[0]);
        setItems(data);
      } else {
        const errorData = await res.json();
        console.error("Fetch items error:", errorData);
        if (res.status === 401) {
          toast.error("Session expired. Please login again.");
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Fetch all categories (including empty ones) for the dropdown
      const res = await fetch("/api/categories?includeEmpty=true", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Categories error:", error);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategory]);

  const handleScan = async (data: string) => {
    setShowScanner(false);
    
    // Check if data is a URL (from QR code) or SKU
    let sku = data;
    if (data.includes('/inventory/')) {
      sku = data.split('/inventory/')[1];
    }
    
    // Find item by SKU
    const foundItem = items.find(item => item.sku === sku || item.id === sku);
    
    if (foundItem) {
      if (isAdmin) {
        openEditModal(foundItem);
      } else {
        openQRModal(foundItem);
      }
    } else {
      toast.error("Barang tidak ditemukan!");
    }
  };

  const handleAddItem = async () => {
    try {
      let categoryId = formData.categoryId;

      // If creating a new category, do that first
      if (showNewCategoryInput && newCategoryName.trim()) {
        const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const res = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newCategoryName.trim(),
            color: randomColor,
          }),
        });

        if (res.ok) {
          const newCategory: Category = await res.json();
          categoryId = newCategory.id;
          setCategories([...categories, newCategory]);
          toast.success(`Kategori "${newCategory.name}" berhasil dibuat!`);
        } else {
          const data = await res.json();
          toast.error(data.message || "Gagal membuat kategori");
          return;
        }
      }

      // Validate categoryId
      if (!categoryId) {
        toast.error("Pilih kategori atau buat kategori baru");
        return;
      }

      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          categoryId,
        }),
      });

      if (res.ok) {
        toast.success("Item berhasil ditambahkan!");
        setShowAddModal(false);
        setShowNewCategoryInput(false);
        setNewCategoryName("");
        fetchItems();
        setFormData({
          name: "",
          sku: "",
          categoryId: "",
          quantity: 0,
          minStock: 10,
          unit: "pcs",
          location: "",
          description: "",
        });
      } else if (res.status === 400) {
        const data = await res.json();
        if (data.message?.includes("SKU")) {
          toast.error("SKU sudah ada! Gunakan SKU yang berbeda.");
        } else {
          toast.error(data.message || "Gagal menambahkan item");
        }
      } else {
        const data = await res.json();
        toast.error(data.message || "Gagal menambahkan item");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      let categoryId = formData.categoryId;

      // If creating a new category, do that first
      if (showNewCategoryInput && newCategoryName.trim()) {
        const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const res = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newCategoryName.trim(),
            color: randomColor,
          }),
        });

        if (res.ok) {
          const newCategory: Category = await res.json();
          categoryId = newCategory.id;
          setCategories([...categories, newCategory]);
          toast.success(`Kategori "${newCategory.name}" berhasil dibuat!`);
        } else {
          const data = await res.json();
          toast.error(data.message || "Gagal membuat kategori");
          return;
        }
      }

      // Validate categoryId
      if (!categoryId) {
        toast.error("Pilih kategori atau buat kategori baru");
        return;
      }

      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingItem.id,
          ...formData,
          categoryId,
        }),
      });

      if (res.ok) {
        toast.success("Item berhasil diupdate!");
        setIsEditing(false);
        setEditingItem(null);
        setShowNewCategoryInput(false);
        setNewCategoryName("");
        fetchItems();
      } else {
        const data = await res.json();
        toast.error(data.message || "Gagal mengupdate item");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Yakin ingin menghapus item ini?")) return;

    try {
      const res = await fetch(`/api/inventory?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success("Item berhasil dihapus!");
        fetchItems();
      } else {
        const data = await res.json();
        toast.error(data.message || "Gagal menghapus item");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleExportExcel = () => {
    if (items.length === 0) {
      toast.error("Tidak ada data untuk diexport!");
      return;
    }

    const data = items.map((item) => ({
      Name: item.name,
      SKU: item.sku,
      Category: item.category.name,
      Quantity: item.quantity,
      MinStock: item.minStock,
      Unit: item.unit,
      Location: item.location || "",
      Description: item.description || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data, {
      header: ["Name", "SKU", "Category", "Quantity", "MinStock", "Unit", "Location", "Description"],
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");

    XLSX.writeFile(wb, `inventory_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Excel berhasil diexport!");
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error("File Excel kosong!");
        setLoading(false);
        event.target.value = "";
        return;
      }

      console.log("Raw importing data:", jsonData);

      // Debug: log the first row keys to see what columns are detected
      if (jsonData.length > 0) {
        console.log("First row keys:", Object.keys(jsonData[0]));
        console.log("First row data:", jsonData[0]);
      }

      // Normalize column names (case-insensitive)
      const normalizedData = jsonData.map((row: any) => {
        const normalized: any = {};
        Object.keys(row).forEach((key) => {
          const normalizedKey = key.trim().toLowerCase();
          const value = row[key];
          console.log(`Processing key: "${key}" -> normalized: "${normalizedKey}" = ${value}`);
          
          // Map various column name variations
          if (normalizedKey === "name" || normalizedKey === "nama" || normalizedKey === "item name") {
            normalized.name = value;
          } else if (normalizedKey === "sku" || normalizedKey === "kode" || normalizedKey === "item code") {
            normalized.sku = value;
          } else if (normalizedKey === "category" || normalizedKey === "kategori") {
            normalized.category = value;
          } else if (normalizedKey === "quantity" || normalizedKey === "qty" || normalizedKey === "stock") {
            normalized.quantity = value;
          } else if (normalizedKey === "minstock" || normalizedKey === "min stock" || normalizedKey === "minimum stock") {
            normalized.minStock = value;
          } else if (normalizedKey === "unit" || normalizedKey === "satuan") {
            normalized.unit = value;
          } else if (normalizedKey === "location" || normalizedKey === "lokasi" || normalizedKey === "tempat") {
            normalized.location = value;
          } else if (normalizedKey === "description" || normalizedKey === "deskripsi" || normalizedKey === "keterangan") {
            normalized.description = value;
          }
        });
        console.log("Normalized row:", normalized);
        return normalized;
      });

      console.log("Final normalized data:", normalizedData);

      // Fetch current items to check for existing SKUs
      const currentItems = await fetch("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json());

      const results = await Promise.allSettled(
        normalizedData.map(async (row) => {
          if (!row.name || !row.sku) {
            console.warn("Skipping row - missing name or SKU:", row);
            return { status: "rejected", reason: "Missing Name or SKU. Pastikan kolom Name dan SKU ada di Excel." };
          }

          // Find or create category
          let category = categories.find((c) => c.name.toLowerCase() === row.category?.toString().toLowerCase());

          // If category doesn't exist and createNewCategory is enabled, create it
          if (!category && createNewCategory && row.category) {
            try {
              const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
              const randomColor = colors[Math.floor(Math.random() * colors.length)];

              const res = await fetch("/api/categories", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  name: row.category,
                  color: randomColor,
                }),
              });

              if (res.ok) {
                const newCategory: Category = await res.json();
                category = newCategory;
                categories.push(newCategory); // Add to local categories array
                console.log("Created new category:", row.category);
              } else {
                const errorData = await res.json();
                console.error("Failed to create category:", row.category, errorData);
                return { status: "rejected", reason: `Gagal membuat kategori '${row.category}': ${errorData.message}` };
              }
            } catch (error) {
              console.error("Error creating category:", row.category, error);
              return { status: "rejected", reason: `Error membuat kategori '${row.category}'` };
            }
          }

          // If category doesn't exist and we couldn't create it, skip this row
          if (!category) {
            console.warn("Category not found:", row.category);
            return { 
              status: "rejected", 
              reason: createNewCategory 
                ? `Gagal membuat kategori '${row.category}'`
                : `Category '${row.category}' tidak ditemukan. Centang "Create new category" atau buat kategori terlebih dahulu.` 
            };
          }

          // Check if item with this SKU already exists
          const existingItem = currentItems.find((item: Item) => item.sku.toLowerCase() === String(row.sku).toLowerCase());

          try {
            if (existingItem && updateExisting) {
              // Update existing item
              const res = await fetch("/api/inventory", {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  id: existingItem.id,
                  name: row.name,
                  sku: row.sku,
                  categoryId: category.id,
                  quantity: parseInt(row.quantity) || 0,
                  minStock: parseInt(row.minStock) || 10,
                  unit: row.unit || "pcs",
                  location: row.location || "",
                  description: row.description || "",
                }),
              });

              if (!res.ok) {
                const errorData = await res.json();
                console.error("Failed to update row:", row, errorData);
                return { status: "rejected", reason: errorData.message || "Failed to update item" };
              }

              return { status: "fulfilled", value: row.name, type: "updated" };
            } else if (existingItem && !updateExisting) {
              // Skip existing item
              console.warn("Skipping existing SKU:", row.sku);
              return { status: "rejected", reason: `SKU '${row.sku}' sudah ada` };
            } else {
              // Create new item
              const requestBody = {
                name: row.name,
                sku: row.sku,
                categoryId: category.id,
                quantity: parseInt(row.quantity) || 0,
                minStock: parseInt(row.minStock) || 10,
                unit: row.unit || "pcs",
                location: row.location || "",
                description: row.description || "",
              };
              
              console.log("Creating item with body:", requestBody);
              
              const res = await fetch("/api/inventory", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
              });

              console.log("Create item response status:", res.status);

              if (!res.ok) {
                const errorData = await res.json();
                console.error("Failed to import row:", row, "API Response:", errorData);
                return { status: "rejected", reason: errorData.message || "Failed to create item" };
              }

              const newItem = await res.json();
              console.log("Created item:", newItem);
              return { status: "fulfilled", value: row.name, type: "created" };
            }
          } catch (error) {
            console.error("Error importing row:", row, error);
            return { status: "rejected", reason: error instanceof Error ? error.message : "Unknown error" };
          }
        })
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failedCount = results.filter((r) => r.status === "rejected").length;
      const updatedCount = results.filter((r) => r.status === "fulfilled" && (r as FulfilledResult).value?.type === "updated").length;
      const createdCount = successCount - updatedCount;

      console.log("Import results:", { success: successCount, failed: failedCount, updated: updatedCount, created: createdCount });

      if (successCount > 0) {
        toast.success(`Berhasil import ${successCount} item (${createdCount} baru, ${updatedCount} diupdate)!`);
        console.log("Fetching items after import...");
        await fetchItems();
        console.log("Fetching categories after import...");
        await fetchCategories();
      } else if (failedCount > 0) {
        toast.error(`Gagal import ${failedCount} item. Lihat console untuk detail.`);
      }

      if (failedCount > 0) {
        const failedReasons = results
          .filter((r) => r.status === "rejected")
          .map((r, i) => `${i + 1}. ${(r as PromiseRejectedResult).reason}`)
          .slice(0, 5); // Show only first 5 errors

        toast.error(`Gagal import ${failedCount} item:\n${failedReasons.join("\n")}`);
      }

      if (successCount === 0 && failedCount === 0) {
        toast("Tidak ada data yang valid untuk diimport");
      }

    } catch (error) {
      console.error("Import error:", error);
      toast.error("Gagal mengimport Excel: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      categoryId: item.category.id,
      quantity: item.quantity,
      minStock: item.minStock,
      unit: item.unit,
      location: item.location || "",
      description: item.description || "",
    });
    setShowNewCategoryInput(false);
    setNewCategoryName("");
    setIsEditing(true);
  };

  const openQRModal = (item: Item) => {
    setQrItem(item);
    setQrQty(item.quantity);
    setShowQRModal(true);
  };

  const handleUpdateQrQty = async () => {
    if (!qrItem) return;

    try {
      const res = await fetch(`/api/inventory/${qrItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity: qrQty,
        }),
      });

      if (res.ok) {
        toast.success("Quantity berhasil diupdate!");
        fetchItems();
        setShowQRModal(false);
      } else {
        const data = await res.json();
        toast.error(data.message || "Gagal update quantity");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const downloadQRCode = () => {
    if (!qrItem) return;

    const canvas = document.getElementById(`qr-${qrItem.id}`) as HTMLCanvasElement;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `qrcode_${qrItem.sku}.png`);
          toast.success("QR Code berhasil didownload!");
        }
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Inventory
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Kelola barang inventaris kantor
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center w-full lg:w-auto">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              className="hidden"
              id="excel-import"
            />
            <label
              htmlFor="excel-import"
              className="btn-secondary flex items-center gap-2 cursor-pointer text-sm whitespace-nowrap"
            >
              <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Import Excel</span>
              <span className="sm:hidden">Import</span>
            </label>
            <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
                className="w-3 h-3 sm:w-4 sm:h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="hidden sm:inline">Update existing</span>
            </label>
            <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={createNewCategory}
                onChange={(e) => setCreateNewCategory(e.target.checked)}
                className="w-3 h-3 sm:w-4 sm:h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="hidden sm:inline">Create new</span>
              <span className="sm:hidden">New Cat</span>
            </label>
            <button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2 text-sm whitespace-nowrap">
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Export Excel</span>
              <span className="sm:hidden">Export</span>
            </button>
            <button
              onClick={() => setShowScanner(true)}
              className="btn-secondary flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Scan QR</span>
              <span className="sm:hidden">Scan</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add Item</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="card flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="relative w-full sm:min-w-[200px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <Filter className="w-5 h-5 text-gray-400" />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field pl-10 w-full appearance-none cursor-pointer"
              style={{ paddingRight: "2.5rem" }}
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    SKU
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Nama
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Kategori
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Qty
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Min Stock
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Unit
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Lokasi
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-3 px-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                      {item.sku}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: item.category.color }}
                      >
                        {item.category.name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-medium ${
                          item.quantity <= item.minStock
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {item.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.minStock}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.unit}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.location || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openQRModal(item)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="QR Code"
                        >
                          <QrCode className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        {(isAdmin || user?.role === "USER") && (
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {items.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Belum ada data inventaris
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || isEditing) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Edit Item" : "Add Item"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kategori
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => {
                    if (e.target.value === "__new__") {
                      setShowNewCategoryInput(true);
                      setFormData({ ...formData, categoryId: "" });
                    } else {
                      setShowNewCategoryInput(false);
                      setFormData({ ...formData, categoryId: e.target.value });
                    }
                  }}
                  className="input-field"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="__new__">+ Buat Kategori Baru</option>
                </select>
              </div>
              {showNewCategoryInput && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nama Kategori Baru
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="input-field"
                    placeholder="Masukkan nama kategori"
                    autoFocus
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Min Stock
                  </label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minStock: parseInt(e.target.value) || 10,
                      })
                    }
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lokasi</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input-field"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingItem(null);
                  setShowAddModal(false);
                  setShowNewCategoryInput(false);
                  setNewCategoryName("");
                  setFormData({
                    name: "",
                    sku: "",
                    categoryId: "",
                    quantity: 0,
                    minStock: 10,
                    unit: "pcs",
                    location: "",
                    description: "",
                  });
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={isEditing ? handleUpdateItem : handleAddItem}
                className="flex-1 btn-primary"
              >
                {isEditing ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && qrItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">QR Code - {qrItem.name}</h2>
            <div className="flex justify-center mb-4">
              <QRCode
                id={`qr-${qrItem.id}`}
                value={`${window.location.origin}/inventory/${qrItem.id}`}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              SKU: {qrItem.sku}
            </p>
            
            {/* Qty Input for User */}
            {!isAdmin && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-left">
                  Quantity
                </label>
                <input
                  type="number"
                  value={qrQty}
                  onChange={(e) => setQrQty(parseInt(e.target.value) || 0)}
                  className="input-field text-center text-lg font-semibold"
                />
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 btn-secondary"
              >
                Close
              </button>
              {!isAdmin && (
                <button onClick={handleUpdateQrQty} className="flex-1 btn-primary">
                  Update Qty
                </button>
              )}
              {isAdmin && (
                <button onClick={downloadQRCode} className="flex-1 btn-primary">
                  Download PNG
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </DashboardLayout>
  );
}
