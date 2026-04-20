"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import toast from "react-hot-toast";
import { Package } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, hasLoaded, loadFromStorage } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // Wait for localStorage to load
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Wait for load to complete, then check auth
  useEffect(() => {
    if (hasLoaded && isAuthenticated) {
      console.log("Login: Already authenticated, redirecting to dashboard");
      router.push("/dashboard");
    }
  }, [hasLoaded, isAuthenticated, router]);

  // Show loading while waiting for storage to load
  if (!hasLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-spin">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Already authenticated, will redirect
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">OSCS</h1>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log("Submitting login with:", { username: formData.username, password: "***" });

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      console.log("Login response status:", res.status);

      const data = await res.json();

      if (!res.ok) {
        console.error("Login error:", data);
        throw new Error(data.message || "Login failed");
      }

      console.log("Login success, user:", data.user);
      
      login(data.user, data.token);
      toast.success("Login berhasil!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              OSCS
            </h1>
            <p className="text-gray-600 text-center mt-2">
              Office Supply Control System
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Copyright */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600">
              Copyright © 2026 Rifka Ashiyamawati - Farmers Market Green Sedayu
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
