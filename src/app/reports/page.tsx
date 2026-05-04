"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import toast from "react-hot-toast";
import { FileDown, Calendar, TrendingUp, Package } from "lucide-react";
import * as XLSX from "xlsx";

export default function ReportsPage() {
  const { user, token } = useAppStore();
  const [reportType, setReportType] = useState<"DAILY" | "WEEKLY" | "MONTHLY">(
    "DAILY"
  );
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${reportType}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setReportData(data);
        toast.success("Report berhasil digenerate!");
      } else {
        toast.error("Gagal generate report");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when report type changes
  useEffect(() => {
    generateReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType]);

  const exportReport = () => {
    if (!reportData) return;

    const generatedDate = new Date().toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Prepare data for Excel
    const reportTypeText = reportType === "DAILY" ? "Harian" : reportType === "WEEKLY" ? "Mingguan" : "Bulanan";
    
    // Create worksheet data
    const data = [
      // Header info
      ["LAPORAN BARANG KELUAR - OSCS"],
      [`Periode: ${reportTypeText}`],
      [`Digenerate pada: ${generatedDate}`],
      [], // Empty row
      // Table headers
      ["No", "Nama Barang", "Kategori", "Harga", "Stok Saat Ini", "Total Keluar", "Total Nilai"],
    ];

    // Add data rows
    if (reportData.top5 && reportData.top5.length > 0) {
      reportData.top5.forEach((item: any, index: number) => {
        const totalNilai = (item.price || 0) * (item._count?.totalOut || 0);
        data.push([
          index + 1,
          item.name,
          item.category?.name || "-",
          `Rp ${item.price?.toLocaleString() || "0"}`,
          item.quantity,
          item._count?.totalOut || 0,
          `Rp ${totalNilai.toLocaleString()}`,
        ]);
      });

      // Add summary row
      data.push([]); // Empty row
      data.push(["", "", "", "", "", "TOTAL COST:", `Rp ${reportData.totalCost?.toLocaleString() || "0"}`]);
    } else {
      data.push(["Tidak ada data barang keluar pada periode ini"]);
    }

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },  // No
      { wch: 30 }, // Nama Barang
      { wch: 20 }, // Kategori
      { wch: 15 }, // Harga
      { wch: 15 }, // Stok Saat Ini
      { wch: 15 }, // Total Keluar
      { wch: 18 }, // Total Nilai
    ];

    // Merge cells for title and summary
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Title row
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Period row
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }, // Generated date row
      { s: { r: data.length - 1, c: 5 }, e: { r: data.length - 1, c: 6 } }, // TOTAL COST merge
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Barang Keluar");

    // Generate filename
    const filename = `report_barang_keluar_${reportType.toLowerCase()}_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
    toast.success("Excel berhasil diexport!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate dan lihat laporan inventaris
          </p>
        </div>

        {/* Report Type Selection */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Pilih Tipe Report</h2>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button
              onClick={() => setReportType("DAILY")}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                reportType === "DAILY"
                  ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <Calendar className="w-6 h-6 mx-auto mb-2 text-primary-600" />
              <p className="font-medium">Harian</p>
            </button>
            <button
              onClick={() => setReportType("WEEKLY")}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                reportType === "WEEKLY"
                  ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <Calendar className="w-6 h-6 mx-auto mb-2 text-primary-600" />
              <p className="font-medium">Mingguan</p>
            </button>
            <button
              onClick={() => setReportType("MONTHLY")}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                reportType === "MONTHLY"
                  ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <Calendar className="w-6 h-6 mx-auto mb-2 text-primary-600" />
              <p className="font-medium">Bulanan</p>
            </button>
          </div>

          {reportData && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Periode:</strong> {reportType === "DAILY" ? "Hari Ini" : reportType === "WEEKLY" ? "Minggu Ini" : "Bulan Ini"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {new Date(reportData.period.split(" - ")[0]).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}{" "}
                -{" "}
                {new Date(reportData.period.split(" - ")[1]).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </p>
              {reportData.totalCost !== undefined && (
                <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Total Pengeluaran: <span className="text-green-600">Rp {reportData.totalCost.toLocaleString()}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={generateReport}
            disabled={loading}
            className="w-full btn-primary py-3 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            {loading ? "Generating..." : "Refresh Report"}
          </button>
        </div>

        {/* Top 5 Items */}
        {reportData?.top5 && reportData.top5.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Top 5 Barang Keluar Terbanyak
            </h2>
            <div className="space-y-3">
              {reportData.top5.map((item: any, index: number) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.category?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Stock: {item.quantity}
                    </p>
                    <p className="text-xs text-red-600 font-medium">
                      Total Keluar: {item._count?.totalOut || 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export */}
        {reportData && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Export Report</h2>
            <button onClick={exportReport} className="btn-primary flex items-center gap-2">
              <FileDown className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
