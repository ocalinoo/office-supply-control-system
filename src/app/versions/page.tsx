"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { History, Clock } from "lucide-react";

interface VersionHistory {
  id: string;
  itemId: string;
  changes: string;
  changedBy: string;
  changedAt: string;
  snapshot: string;
  item?: {
    name: string;
    sku: string;
  };
}

export default function VersionsPage() {
  const { token } = useAppStore();
  const [versions, setVersions] = useState<VersionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayChanges, setTodayChanges] = useState<VersionHistory[]>([]);

  const fetchVersions = async () => {
    try {
      const res = await fetch("/api/versions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setVersions(data);

        // Filter today's changes
        const today = new Date().toDateString();
        const todayData = data.filter((v: VersionHistory) => {
          return new Date(v.changedAt).toDateString() === today;
        });
        setTodayChanges(todayData);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Version History
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track semua perubahan barang inventaris
          </p>
        </div>

        {/* Today's Highlights */}
        {todayChanges.length > 0 && (
          <div className="card bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600" />
              Highlight Hari Ini
            </h2>
            <div className="space-y-3">
              {todayChanges.map((version) => (
                <div
                  key={version.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {version.item?.name || "Item"} ({version.item?.sku})
                      </p>
                      <p className="text-sm text-primary-600 mt-1">
                        {version.changes}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(version.changedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Changed by: {version.changedBy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Versions */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-600" />
            Semua Perubahan
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Item
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Perubahan
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Changed By
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <tr
                    key={version.id}
                    className="border-t border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {version.item?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-500">{version.item?.sku}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-primary-600">
                        {version.changes}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {version.changedBy}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(version.changedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {versions.length === 0 && (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Belum ada riwayat perubahan
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
