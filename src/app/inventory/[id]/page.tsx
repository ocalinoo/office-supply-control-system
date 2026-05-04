"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { useAppStore } from "@/store/app-store";
import toast from "react-hot-toast";
import { Package, ArrowLeft } from "lucide-react";

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

export default function InventoryItemPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const { user, token, loadFromStorage, hasLoaded } = useAppStore();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [qtyToTake, setQtyToTake] = useState<number>(0); // Jumlah yang diambil
  const [action, setAction] = useState<"view" | "edit">("view");

  const isAdmin = user?.role === "ADMIN";
  const itemId = params?.id as string;

  // Load token from localStorage on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!itemId || !hasLoaded) return;
    if (!token) {
      console.log("No token found, redirecting to login");
      toast.error("Session expired. Please login again.");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }

    const fetchItem = async () => {
      try {
        console.log("Fetching item with ID:", itemId);
        console.log("Token present:", !!token);
        
        const res = await fetch(`/api/inventory/${itemId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Response status:", res.status);

        if (res.ok) {
          const data = await res.json();
          console.log("Item data:", data);
          setItem(data);
          // Admin langsung edit, user biasa view mode
          setAction(isAdmin ? "edit" : "view");
        } else if (res.status === 401) {
          console.error("Unauthorized - token invalid/expired");
          toast.error("Session expired. Please login again.");
          setTimeout(() => router.push("/login"), 1500);
        } else {
          const errorData = await res.json();
          console.error("API error:", errorData);
          toast.error(`Item tidak ditemukan! (${res.status})`);
          setTimeout(() => router.push("/inventory"), 2000);
        }
      } catch (error) {
        console.error("Error fetching item:", error);
        toast.error("Gagal memuat data item");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, token, hasLoaded]);

  const handleUpdateQuantity = async () => {
    if (!item) return;

    // Validate: qtyToTake tidak boleh lebih dari current stock
    if (qtyToTake > item.quantity) {
      toast.error(`Jumlah yang diambil tidak boleh melebihi stock (${item.quantity} ${item.unit})!`);
      return;
    }

    if (qtyToTake <= 0) {
      toast.error("Jumlah yang diambil harus lebih dari 0!");
      return;
    }

    try {
      const newQty = item.quantity - qtyToTake;

      const res = await fetch(`/api/inventory/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity: newQty,
          qtyTaken: qtyToTake, // Send the amount taken for logging
        }),
      });

      if (res.ok) {
        toast.success(`Berhasil mengambil ${qtyToTake} ${item.unit}! Stock sisa: ${newQty}`);
        router.push("/inventory");
      } else {
        const data = await res.json();
        toast.error(data.message || "Gagal update quantity");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleSaveEdit = async () => {
    if (!item) return;

    try {
      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: item.id,
          name: item.name,
          sku: item.sku,
          categoryId: item.category.id,
          quantity: item.quantity,
          minStock: item.minStock,
          unit: item.unit,
          location: item.location,
          description: item.description,
        }),
      });

      if (res.ok) {
        toast.success("Item berhasil diupdate!");
        router.push("/inventory");
      } else {
        const data = await res.json();
        toast.error(data.message || "Gagal update item");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!item) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Item tidak ditemukan</p>
            <button
              onClick={() => router.push("/inventory")}
              className="mt-4 btn-primary"
            >
              Kembali ke Inventory
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/inventory")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {item.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              SKU: {item.sku}
            </p>
          </div>
        </div>

        {/* Item Card */}
        <div className="card">
          <div className="space-y-4">
            {/* Category Badge */}
            <div className="flex items-center gap-2">
              <span
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: item.category.color }}
              >
                {item.category.name}
              </span>
            </div>

            {/* Quantity Display */}
            <div className="text-center py-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Current Stock
              </p>
              <p className="text-5xl font-bold text-gray-900 dark:text-white">
                {item.quantity}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {item.unit}
              </p>
            </div>

            {/* Qty To Take Input */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Jumlah yang diambil
              </label>
              <input
                type="number"
                value={qtyToTake}
                onChange={(e) => setQtyToTake(parseInt(e.target.value) || 0)}
                className="input-field text-center text-lg font-semibold"
                placeholder="0"
                min="0"
                max={item.quantity}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                Stock setelah pengambilan: <span className="font-semibold">{item.quantity - qtyToTake} {item.unit}</span>
              </p>
            </div>

            {/* Additional Info */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              {item.location && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Location:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.location}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Min Stock:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.minStock} {item.unit}
                </span>
              </div>
              {item.description && (
                <div className="pt-2">
                  <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Description:
                  </span>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {item.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/inventory")}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          {isAdmin ? (
            <button onClick={handleSaveEdit} className="flex-1 btn-primary">
              Save Changes
            </button>
          ) : (
            <button onClick={handleUpdateQuantity} className="flex-1 btn-primary">
              Ambil {qtyToTake > 0 ? qtyToTake : ''} {item.unit}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
