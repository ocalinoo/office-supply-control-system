"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  FileText,
  History,
  MessageSquare,
  LogOut,
  Shield,
  Users,
  X,
  Menu,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { useState } from "react";
import ThemeSwitcher from "./ThemeSwitcher";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAppStore();

  // Check if user has privilege for a specific menu
  const hasPrivilege = (privilege: string) => {
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    if (!user.privileges) return false;
    return user.privileges.includes(privilege);
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, privilege: null },
    { name: "Inventory", href: "/inventory", icon: Package, privilege: "inventory" },
    { name: "Reports", href: "/reports", icon: FileText, privilege: "reports" },
    { name: "Version History", href: "/versions", icon: History, privilege: "versions" },
    { name: "AI Assistant", href: "/assistant", icon: MessageSquare, privilege: "assistant" },
    { name: "User Management", href: "/users", icon: Users, privilege: "users" },
  ];

  const sidebarContent = (
    <>
      {/* Close button for mobile */}
      <div className="md:hidden flex items-center justify-end p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onMobileClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Logo */}
      <div className="hidden md:flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-primary-600">OSCS</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          if (item.privilege && !hasPrivilege(item.privilege)) return null;

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Theme Switcher */}
      <div className="hidden md:block p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Theme
        </p>
        <ThemeSwitcher />
      </div>

      {/* User Info */}
      {user && (
        <div className="hidden md:block p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.role}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              onMobileClose?.();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      )}

      {/* Mobile Theme Switcher */}
      <div className="md:hidden p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Theme
        </p>
        <ThemeSwitcher />
      </div>

      {/* Mobile User Info */}
      {user && (
        <div className="md:hidden p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.role}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              onMobileClose?.();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col z-40">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar - Slide-out drawer */}
      <>
        {/* Overlay - Only visible when mobileOpen is true */}
        {mobileOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={onMobileClose}
          />
        )}
        
        {/* Sidebar Panel */}
        <div
          className={`md:hidden fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out z-50 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full">
            {sidebarContent}
          </div>
        </div>
      </>
    </>
  );
}
