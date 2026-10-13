"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, Menu, X, Sparkles, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isLanding = pathname === "/";

  const publicNavLinks = [
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Family Kitchen", href: "/#family-kitchen" },
    { label: "Cook Along", href: "/#cook-along" },
    { label: "App Preview", href: "/dashboard" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-warm-200/80 bg-warm-50/95 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Simmory Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500 rounded-lg p-1"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-terracotta-500 text-white flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-warm-900 leading-none">
              Simmory
            </span>
            <span className="text-[10px] sm:text-[11px] text-warm-500 font-sans tracking-wide leading-tight mt-0.5">
              The way they made it
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        {isLanding ? (
          <nav className="hidden md:flex items-center gap-8">
            {publicNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-warm-700 hover:text-terracotta-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}

        {/* Right CTA / Action */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-warm-700 hover:text-terracotta-600 transition-colors px-2 py-1"
          >
            Sign In
          </Link>
          <Link href="/upload">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ChefHat className="w-3.5 h-3.5 text-terracotta-600" />}
            >
              Preserve Recipe
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Enter Kitchen
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-warm-700 hover:text-warm-900 hover:bg-warm-200/60 transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta-500"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-warm-200 bg-warm-50 px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in fade-in duration-150">
          <nav className="flex flex-col space-y-2">
            {publicNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-warm-800 hover:bg-warm-100 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-warm-200 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-medium text-warm-700 hover:text-terracotta-600"
              >
                Sign In
              </Link>
              <Link
                href="/upload"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="outline" size="md" className="w-full justify-center">
                  Preserve Recipe
                </Button>
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="primary" size="md" className="w-full justify-center">
                  Enter Kitchen
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
