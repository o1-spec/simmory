"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  FolderHeart,
  BookOpen,
  UploadCloud,
  CheckSquare,
  PlayCircle,
  UtensilsCrossed,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { label: "Kitchen Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Family Kitchens", href: "/kitchens", icon: FolderHeart },
    { label: "Saved Recipes", href: "/recipes", icon: BookOpen },
    { label: "Preserve Recipe", href: "/upload", icon: UploadCloud },
    { label: "Settings & Security", href: "/settings", icon: Settings },
    { label: "AI Review Editor", href: "/review/demo", icon: CheckSquare },
    { label: "Interactive Cook Along", href: "/cook/demo", icon: PlayCircle },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  return (
    <div className="lg:hidden sticky top-0 z-40 bg-warm-50/95 backdrop-blur-md border-b border-warm-200/80 px-4 h-16 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-terracotta-500 text-white flex items-center justify-center">
          <UtensilsCrossed className="w-4 h-4" />
        </div>
        <span className="font-serif text-lg font-medium text-warm-900">
          Simmory
        </span>
      </Link>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-warm-700 hover:text-warm-900 rounded-lg hover:bg-warm-100 transition-colors"
        aria-label="Toggle navigation drawer"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-warm-50 border-b border-warm-200 p-4 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <nav className="space-y-1">
            {links.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/dashboard" && pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "bg-terracotta-500 text-white font-semibold"
                      : "text-warm-700 hover:bg-warm-100 hover:text-warm-900"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-warm-200 mt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
