"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, Menu, X, ChefHat, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isLanding = pathname === "/";

  const publicNavLinks = [
    { label: "The Story", href: "/#story" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Recipe Archive", href: "/#recipes" },
    { label: "Family Kitchen", href: "/#kitchen" },
    { label: "Cook Along", href: "/#cook-along" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#DDDCD3] bg-[#F2F2EB]/95 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
        {/* Simmory Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E4742] rounded-lg p-1"
        >
          <div className="w-10 h-10 rounded-xl bg-[#2E4742] text-[#F2F2EB] flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105">
            <UtensilsCrossed className="w-5 h-5 text-[#F2F2EB]" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-2xl font-bold tracking-tight text-[#202723] leading-none">
              SIMMORY
            </span>
            <span className="text-[10px] text-[#525B56] font-mono uppercase tracking-wider leading-tight mt-0.5">
              Family Culinary Archive
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
                className="text-sm font-medium text-[#525B56] hover:text-[#2E4742] transition-colors"
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
            className="text-sm font-medium text-[#525B56] hover:text-[#202723] transition-colors px-3 py-1.5"
          >
            Sign In
          </Link>
          <Link href="/upload">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ChefHat className="w-3.5 h-3.5 text-[#2E4742]" />}
            >
              Preserve Recipe
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
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
            className="p-2 rounded-lg text-[#202723] hover:bg-[#DDDCD3]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2E4742]"
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

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-[#DDDCD3] bg-[#FAF9F5] px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          {isLanding && (
            <div className="space-y-1 pb-3 border-b border-[#DDDCD3]/60">
              {publicNavLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-[#525B56] hover:text-[#2E4742] hover:bg-[#EAE9E1]/60"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2 text-sm font-medium text-[#525B56] hover:text-[#202723]"
            >
              Sign In to Your Account
            </Link>
            <Link href="/upload" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center" size="md">
                Preserve a Recipe
              </Button>
            </Link>
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full justify-center" size="md">
                Enter Family Kitchen
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
