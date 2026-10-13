"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderHeart,
  BookOpen,
  UploadCloud,
  CheckSquare,
  PlayCircle,
  UtensilsCrossed,
  Sparkles,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isPrototypeLink?: boolean;
}

const mainNavItems: NavItem[] = [
  {
    label: "Kitchen Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Family Kitchens",
    href: "/kitchens",
    icon: FolderHeart,
  },
  {
    label: "Saved Recipes",
    href: "/recipes",
    icon: BookOpen,
  },
  {
    label: "Cooking Videos",
    href: "/videos",
    icon: PlayCircle,
  },
  {
    label: "Preserve Recipe",
    href: "/upload",
    icon: UploadCloud,
  },
  {
    label: "Settings & Security",
    href: "/settings",
    icon: Settings,
  },
];

const experienceNavItems: NavItem[] = [
  {
    label: "AI Recipe Review",
    href: "/review/demo",
    icon: CheckSquare,
    badge: "Preview",
    isPrototypeLink: true,
  },
  {
    label: "Interactive Cook Along",
    href: "/cook/demo",
    icon: PlayCircle,
    badge: "Preview",
    isPrototypeLink: true,
  },
];

interface CurrentUserInfo {
  id: string;
  name: string;
  email: string;
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {
        // Silently ignore if unauthenticated on public pages
      });

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const isItemActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 border-r border-warm-200/80 bg-warm-50/80 shrink-0 flex flex-col justify-between h-screen sticky top-0 overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center border-b border-warm-200/80">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-terracotta-500 text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif text-xl font-medium tracking-tight text-warm-900 block leading-none">
                Simmory
              </span>
              <span className="text-[10px] text-warm-500 font-sans tracking-wide block mt-1">
                Family Kitchen
              </span>
            </div>
          </Link>
        </div>

        {/* Current Active Kitchen Context */}
        <div className="p-4 mx-4 my-4 rounded-xl bg-white border border-warm-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-warm-500">
              Active Archive
            </span>
            <span className="w-2 h-2 rounded-full bg-sage-500" />
          </div>
          <p className="font-serif text-sm font-medium text-warm-900 truncate">
            {currentUser?.name ? `${currentUser.name}'s Kitchen` : "Family Kitchen Space"}
          </p>
          <p className="text-[11px] text-warm-500 truncate mt-0.5">
            Private Archive
          </p>
        </div>

        {/* Navigation Sections */}
        <div className="px-3 space-y-6">
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-warm-400">
              Kitchen Core
            </div>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const active = isItemActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                      active
                        ? "bg-terracotta-500 text-white shadow-xs font-semibold"
                        : "text-warm-700 hover:text-warm-900 hover:bg-warm-200/70"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "w-4 h-4 transition-colors",
                          active
                            ? "text-white"
                            : "text-warm-500 group-hover:text-warm-800"
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <Badge
                        variant={active ? "outline" : "terracotta"}
                        size="sm"
                        className={active ? "text-white border-white/40 text-[10px]" : "text-[10px]"}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-warm-400">
              <span>Interactive Views</span>
              <Sparkles className="w-3 h-3 text-terracotta-500" />
            </div>
            <nav className="space-y-1">
              {experienceNavItems.map((item) => {
                const active = isItemActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                      active
                        ? "bg-terracotta-500 text-white shadow-xs font-semibold"
                        : "text-warm-700 hover:text-warm-900 hover:bg-warm-200/70"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "w-4 h-4 transition-colors",
                          active
                            ? "text-white"
                            : "text-warm-500 group-hover:text-warm-800"
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <Badge
                        variant={active ? "outline" : "warm"}
                        size="sm"
                        className={active ? "text-white border-white/40 text-[10px]" : "text-[10px]"}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Sidebar Footer with Authenticated User & Logout */}
      <div className="p-3 m-3 rounded-xl bg-warm-100/80 border border-warm-200/80 space-y-2">
        {currentUser ? (
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/settings"
              className="flex items-center gap-2.5 min-w-0 group hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-terracotta-100 text-terracotta-700 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-warm-900 truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-warm-500 truncate">
                  {currentUser.email}
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-warm-500 hover:text-red-600 hover:bg-warm-200/60 transition-colors"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/login"
              className="flex items-center gap-2 text-xs font-medium text-warm-700 hover:text-warm-900"
            >
              <User className="w-4 h-4 text-warm-500" />
              <span>Sign In</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
