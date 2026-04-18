"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { Package } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, hasLoaded, loadFromStorage } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [manualRedirect, setManualRedirect] = useState(false);

  useEffect(() => {
    try {
      // Load auth from localStorage
      loadFromStorage();
    } catch (err) {
      console.error("Hydration error:", err);
      setError("Failed to initialize app");
    }
  }, [loadFromStorage]);

  useEffect(() => {
    if (hasLoaded && !error) {
      console.log("Loaded from storage, authenticated:", isAuthenticated);
      if (isAuthenticated) {
        console.log("Redirecting to dashboard...");
        router.push("/dashboard");
      } else {
        console.log("Redirecting to login...");
        router.push("/login");
      }
      
      // Show manual redirect links if automatic redirect fails
      const timeout = setTimeout(() => {
        setManualRedirect(true);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated, router, hasLoaded, error]);

  const handleManualRedirect = () => {
    if (isAuthenticated) {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/login";
    }
  };

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 to-red-200">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-900 mb-2">Error</h1>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            Reload Page
          </button>
        </div>
      </main>
    );
  }

  if (!hasLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-spin">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full"></div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            OSCS
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Office Supply Control System
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
            Loading...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-gray-800 dark:to-gray-900">
      <div className="text-center">
        <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Package className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          OSCS
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Office Supply Control System
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
          Redirecting...
        </p>
        {manualRedirect && (
          <div className="mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Redirect not working?
            </p>
            <button
              onClick={handleManualRedirect}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Click here to {isAuthenticated ? "Dashboard" : "Login"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
