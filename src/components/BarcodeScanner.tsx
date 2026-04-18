"use client";

import { useState, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");

    const startScanning = async () => {
      try {
        // Get the container width for responsive QR box
        const container = document.getElementById("qr-reader");
        const containerWidth = container?.clientWidth || 300;
        const qrBoxSize = Math.min(250, containerWidth - 40);

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: qrBoxSize, height: qrBoxSize },
          },
          (decodedText) => {
            onScan(decodedText);
            html5QrCode.stop();
          },
          (error) => {
            // Ignore scan errors
          }
        );
        setScanning(true);
      } catch (err) {
        console.error("Error starting camera:", err);
      }
    };

    startScanning();

    return () => {
      if (scanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold">Scan QR Code</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div id="qr-reader" className="rounded-lg overflow-hidden w-full"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
          Arahkan kamera ke QR Code barang
        </p>
      </div>
    </div>
  );
}
