"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  ChefHat,
  BookOpen,
  FolderHeart,
  Video,
  Plus,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Upload,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface KitchenItem {
  id: string;
  name: string;
  myRole: string;
  isOwner: boolean;
  recipeCount: number;
}

interface CurrentUserInfo {
  id: string;
  name: string;
  email: string;
  kitchenCount?: number;
  recipeCount?: number;
}

export function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [kitchens, setKitchens] = useState<KitchenItem[]>([]);
  const [activeKitchenId, setActiveKitchenId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null);

  const [kitchenMenuOpen, setKitchenMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const kitchenMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        kitchenMenuRef.current &&
        !kitchenMenuRef.current.contains(e.target as Node)
      ) {
        setKitchenMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on pathname change
  useEffect(() => {
    setKitchenMenuOpen(false);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Fetch current user and accessible kitchens
  useEffect(() => {
    let isMounted = true;

    // Load active kitchen from storage if available
    const savedKitchenId =
      typeof window !== "undefined"
        ? localStorage.getItem("simmory_active_kitchen_id")
        : null;

    Promise.all([
      fetch("/api/auth/me").then((res) => (res.ok ? res.json() : null)),
      fetch("/api/kitchens").then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([userData, kitchenData]) => {
        if (!isMounted) return;

        if (userData?.user) {
          setCurrentUser(userData.user);
        }

        if (kitchenData?.kitchens && Array.isArray(kitchenData.kitchens)) {
          setKitchens(kitchenData.kitchens);
          if (kitchenData.kitchens.length > 0) {
            // Find existing saved kitchen or fallback to the first one
            const matched = kitchenData.kitchens.find(
              (k: KitchenItem) => k.id === savedKitchenId
            );
            const chosenId = matched ? matched.id : kitchenData.kitchens[0].id;
            setActiveKitchenId(chosenId);
            if (typeof window !== "undefined") {
              localStorage.setItem("simmory_active_kitchen_id", chosenId);
            }
          }
        }
      })
      .catch(() => {
        // Continue gracefully
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectKitchen = (kitchenId: string) => {
    setActiveKitchenId(kitchenId);
    if (typeof window !== "undefined") {
      localStorage.setItem("simmory_active_kitchen_id", kitchenId);
    }
    setKitchenMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const activeKitchen = kitchens.find((k) => k.id === activeKitchenId) || kitchens[0];

  const navLinks = [
    { label: "Home", href: "/dashboard", icon: ChefHat },
    { label: "Recipes", href: "/recipes", icon: BookOpen },
    { label: "Kitchens", href: "/kitchens", icon: FolderHeart },
    { label: "Videos", href: "/videos", icon: Video },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#DDDCD3] bg-[#FAF9F5]/95 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
          {/* =============================================================== */}
          {/* LEFT: BRAND INSIGNIA & ACTIVE KITCHEN CONTEXT                    */}
          {/* =============================================================== */}
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            {/* Logo */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E4742] rounded-xl p-1 shrink-0"
            >
              <div className="w-10 h-10 rounded-xl bg-[#2E4742] text-[#F2F2EB] flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105">
                <UtensilsCrossed className="w-5 h-5 text-[#F2F2EB]" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-2xl font-bold tracking-tight text-[#202723] leading-none">
                  SIMMORY<span className="text-[#F5B726]">.</span>
                </span>
                <span className="text-[10px] text-[#525B56] font-mono uppercase tracking-wider leading-tight mt-0.5 hidden sm:inline">
                  Family Archive
                </span>
              </div>
            </Link>

            {/* Active Kitchen Selector Dropdown (Desktop & Tablet) */}
            {activeKitchen && (
              <div ref={kitchenMenuRef} className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setKitchenMenuOpen(!kitchenMenuOpen)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F2F2EB] hover:bg-[#EAE9E1] border border-[#DDDCD3] text-xs font-sans text-[#202723] transition-colors focus:outline-none focus:ring-1 focus:ring-[#2E4742] group cursor-pointer max-w-[200px] lg:max-w-[260px]"
                  aria-expanded={kitchenMenuOpen}
                  aria-label="Select active family kitchen"
                >
                  <span className="w-2 h-2 rounded-full bg-[#2E4742] shrink-0" />
                  <span className="font-medium truncate">{activeKitchen.name}</span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-[#525B56] shrink-0 transition-transform duration-200",
                      kitchenMenuOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* Kitchen Dropdown Menu */}
                {kitchenMenuOpen && (
                  <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] p-2 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-[#DDDCD3]/60 mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#7A857F] block">
                        Family Kitchen Context
                      </span>
                      <p className="text-xs text-[#525B56] mt-0.5">
                        Select an archive space to focus your view
                      </p>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                      {kitchens.map((k) => {
                        const isSelected = k.id === activeKitchen.id;
                        return (
                          <button
                            key={k.id}
                            type="button"
                            onClick={() => handleSelectKitchen(k.id)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors",
                              isSelected
                                ? "bg-[#2E4742] text-[#F2F2EB] font-medium"
                                : "text-[#202723] hover:bg-[#F2F2EB]"
                            )}
                          >
                            <div className="min-w-0 pr-2">
                              <span className="block truncate font-display text-sm font-semibold">
                                {k.name}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] font-mono",
                                  isSelected ? "text-[#FAF9F5]/75" : "text-[#7A857F]"
                                )}
                              >
                                {k.recipeCount} recipes &bull; {k.isOwner ? "Owner" : k.myRole}
                              </span>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-[#F5B726] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-[#DDDCD3]/60 mt-1 flex items-center justify-between px-1 text-xs">
                      <Link
                        href="/kitchens/new"
                        onClick={() => setKitchenMenuOpen(false)}
                        className="text-[#2E4742] hover:underline underline-offset-4 font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        New Kitchen
                      </Link>
                      <Link
                        href="/kitchens"
                        onClick={() => setKitchenMenuOpen(false)}
                        className="text-[#525B56] hover:text-[#202723] transition-colors"
                      >
                        Manage All &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* CENTER: DESKTOP PRIMARY APPLICATION NAVIGATION                   */}
          {/* =============================================================== */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/dashboard" && pathname.startsWith(link.href));
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-medium font-sans flex items-center gap-2 transition-all duration-150",
                    active
                      ? "bg-[#2E4742] text-[#FAF9F5] shadow-2xs font-semibold"
                      : "text-[#525B56] hover:text-[#202723] hover:bg-[#F2F2EB]"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", active ? "text-[#F5B726]" : "text-[#7A857F]")} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* =============================================================== */}
          {/* RIGHT: CONTEXTUAL ACTIONS & ACCOUNT ACCESS                       */}
          {/* =============================================================== */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Primary Action Button (Desktop & Tablet) */}
            <Link href="/recipes/new" className="hidden sm:inline-flex">
              <Button
                variant="forest"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="rounded-full shadow-xs"
              >
                Preserve Recipe
              </Button>
            </Link>

            {/* User Account Menu */}
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[#F2F2EB] border border-transparent hover:border-[#DDDCD3] transition-colors focus:outline-none focus:ring-1 focus:ring-[#2E4742]"
                aria-expanded={userMenuOpen}
                aria-label="User account menu"
              >
                <div className="w-8 h-8 rounded-full bg-[#2E4742] text-[#FAF9F5] font-display font-bold text-xs flex items-center justify-center shadow-xs">
                  {currentUser?.name
                    ? currentUser.name.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <span className="hidden xl:inline text-xs font-medium text-[#202723] max-w-[120px] truncate">
                  {currentUser?.name || "Kitchen"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#525B56] hidden xl:inline" />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] p-2 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2.5 border-b border-[#DDDCD3]/60 mb-1">
                    <span className="font-display text-sm font-bold text-[#202723] block leading-snug">
                      {currentUser?.name || "Family Chef"}
                    </span>
                    <span className="text-xs text-[#7A857F] font-mono block truncate">
                      {currentUser?.email}
                    </span>
                    {currentUser?.recipeCount !== undefined && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#2E4742] mt-1 font-semibold">
                        <Sparkles className="w-3 h-3 text-[#F5B726]" />
                        {currentUser.recipeCount} preserved heirloom recipes
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 py-1 text-xs">
                    <Link
                      href="/recipes/new"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#202723] hover:bg-[#F2F2EB] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#2E4742]" />
                      <span>Preserve a Recipe</span>
                    </Link>
                    <Link
                      href="/upload"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#202723] hover:bg-[#F2F2EB] transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#2E4742]" />
                      <span>Upload Cooking Video</span>
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#202723] hover:bg-[#F2F2EB] transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-[#525B56]" />
                      <span>Settings & Security</span>
                    </Link>
                  </div>

                  <div className="pt-1.5 border-t border-[#DDDCD3]/60 mt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#9A2C2C] hover:bg-[#FDF2F2] transition-colors font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#202723] hover:bg-[#F2F2EB] rounded-xl transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* =============================================================== */}
        {/* MOBILE SLIDE-DOWN DRAWER                                        */}
        {/* =============================================================== */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#DDDCD3] bg-[#FAF9F5] p-4 shadow-lg animate-in slide-in-from-top-2 duration-150">
            {/* Active Kitchen Mobile Badge */}
            {activeKitchen && (
              <div className="p-3 bg-[#F2F2EB] rounded-xl border border-[#DDDCD3] mb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#7A857F] block">
                    Active Kitchen Space
                  </span>
                  <span className="font-display text-sm font-bold text-[#202723]">
                    {activeKitchen.name}
                  </span>
                </div>
                <Link
                  href="/kitchens"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs text-[#2E4742] font-semibold underline underline-offset-2"
                >
                  Switch
                </Link>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="space-y-1 mb-4">
              {navLinks.map((link) => {
                const active =
                  pathname === link.href ||
                  (link.href !== "/dashboard" && pathname.startsWith(link.href));
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      active
                        ? "bg-[#2E4742] text-[#FAF9F5] font-semibold"
                        : "text-[#202723] hover:bg-[#F2F2EB]"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              <Link
                href="/upload"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#202723] hover:bg-[#F2F2EB]"
              >
                <Upload className="w-4 h-4 text-[#2E4742]" />
                <span>Upload Cooking Video</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#202723] hover:bg-[#F2F2EB]"
              >
                <Settings className="w-4 h-4 text-[#525B56]" />
                <span>Settings & Security</span>
              </Link>
            </nav>

            <div className="pt-3 border-t border-[#DDDCD3] flex items-center justify-between">
              <span className="text-xs text-[#525B56] font-mono">
                {currentUser?.name || "Family Chef"}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-[#9A2C2C] hover:underline font-semibold flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =================================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly on phones)             */}
      {/* =================================================================== */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#FAF9F5]/95 backdrop-blur-md border-t border-[#DDDCD3] md:hidden px-3 py-2 flex items-center justify-around shadow-sm select-none">
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-sans transition-colors",
            pathname === "/dashboard"
              ? "text-[#2E4742] font-semibold"
              : "text-[#7A857F] hover:text-[#202723]"
          )}
        >
          <ChefHat className="w-4 h-4" />
          <span>Home</span>
        </Link>

        <Link
          href="/recipes"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-sans transition-colors",
            pathname.startsWith("/recipes") && pathname !== "/recipes/new"
              ? "text-[#2E4742] font-semibold"
              : "text-[#7A857F] hover:text-[#202723]"
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>Recipes</span>
        </Link>

        {/* Center Preserve Action */}
        <Link
          href="/recipes/new"
          className="flex flex-col items-center -mt-4 group focus:outline-none"
        >
          <div className="w-11 h-11 rounded-full bg-[#2E4742] text-[#FAF9F5] flex items-center justify-center shadow-md border-2 border-[#FAF9F5] group-active:scale-95 transition-transform">
            <Plus className="w-5 h-5 text-[#F5B726]" />
          </div>
          <span className="text-[10px] text-[#2E4742] font-semibold mt-0.5">Preserve</span>
        </Link>

        <Link
          href="/kitchens"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-sans transition-colors",
            pathname.startsWith("/kitchens")
              ? "text-[#2E4742] font-semibold"
              : "text-[#7A857F] hover:text-[#202723]"
          )}
        >
          <FolderHeart className="w-4 h-4" />
          <span>Kitchens</span>
        </Link>

        <Link
          href="/videos"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-sans transition-colors",
            pathname.startsWith("/videos")
              ? "text-[#2E4742] font-semibold"
              : "text-[#7A857F] hover:text-[#202723]"
          )}
        >
          <Video className="w-4 h-4" />
          <span>Videos</span>
        </Link>
      </div>
    </>
  );
}
