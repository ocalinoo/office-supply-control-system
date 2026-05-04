"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import toast from "react-hot-toast";
import { FileDown, Calendar, TrendingUp, Package } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

    const doc = new jsPDF();
    const generatedDate = new Date().toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Header/Title
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text("Laporan Barang Keluar - OSCS", 14, 20);

    // Report type
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    const reportTypeText = reportType === "DAILY" ? "Harian" : reportType === "WEEKLY" ? "Mingguan" : "Bulanan";
    doc.text(`Periode: ${reportTypeText}`, 14, 28);

    // Generated date
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Digenerate pada: ${generatedDate}`, 14, 35);

    // Summary Section
    let yPos = 45;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Ringkasan Barang Keluar", 14, yPos);
    yPos += 8;

    if (reportData.top5 && reportData.top5.length > 0) {
      const summaryData = reportData.top5.map((item: any, index: number) => [
        `${index + 1}`,
        item.name,
        item.category?.name || "-",
        `${item.quantity}`,
        `${item._count?.totalOut || 0}`,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["No", "Nama Barang", "Kategori", "Stok Saat Ini", "Total Keluar"]],
        body: summaryData,
        theme: "striped",
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: 14, right: 14 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("Tidak ada data barang keluar pada periode ini", 14, yPos);
      yPos += 15;
    }

    // Save PDF
    doc.save(`report_barang_keluar_${reportType.toLowerCase()}_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF berhasil diexport!");
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
              Export PDF
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
