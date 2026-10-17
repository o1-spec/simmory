"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { Heart, UtensilsCrossed } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function EditorialFooter() {
  const footerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced || !footerRef.current) return;

      gsap.fromTo(
        footerRef.current,
        { opacity: 0.7, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 95%",
            once: true,
          },
        }
      );
    },
    { scope: footerRef }
  );

  return (
    <footer
      ref={footerRef}
      className="border-t border-[#DDDCD3] bg-[#FAF9F5] py-16 px-4 sm:px-6 lg:px-8 text-[#525B56]"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2E4742] text-[#F2F2EB] flex items-center justify-center shadow-xs">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-2xl font-bold tracking-tight text-[#202723] leading-none">
                  simmory.
                </span>
                <span className="text-[10px] text-[#7A857F] font-mono uppercase tracking-wider mt-0.5">
                  Family Culinary Archive
                </span>
              </div>
            </Link>
            <p className="font-sans text-sm text-[#525B56] leading-relaxed max-w-sm">
              Preserve traditional family recipes, original cooking videos, tactile techniques, and
              kitchen memories for generations to come.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-[#7A857F]">
              <Heart className="w-3.5 h-3.5 text-[#E97B77]" />
              <span>The way they made it, remembered.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <p className="font-mono text-xs uppercase tracking-wider text-[#202723] font-bold">
              Platform
            </p>
            <ul className="space-y-2 text-xs font-sans">
              <li>
                <Link href="#story" className="hover:text-[#2E4742] transition-colors">
                  The Story
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="hover:text-[#2E4742] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#recipes" className="hover:text-[#2E4742] transition-colors">
                  Recipe Library
                </Link>
              </li>
              <li>
                <Link href="#kitchen" className="hover:text-[#2E4742] transition-colors">
                  Family Kitchen
                </Link>
              </li>
              <li>
                <Link href="#cook-along" className="hover:text-[#2E4742] transition-colors">
                  Interactive Cook Along
                </Link>
              </li>
            </ul>
          </div>

          {/* Application */}
          <div className="md:col-span-2 space-y-3">
            <p className="font-mono text-xs uppercase tracking-wider text-[#202723] font-bold">
              Kitchen
            </p>
            <ul className="space-y-2 text-xs font-sans">
              <li>
                <Link href="/register" className="hover:text-[#2E4742] transition-colors">
                  Create Kitchen
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#2E4742] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/upload" className="hover:text-[#2E4742] transition-colors">
                  Upload Cooking Video
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#2E4742] transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Archival Ethos */}
          <div className="md:col-span-3 space-y-3">
            <p className="font-mono text-xs uppercase tracking-wider text-[#202723] font-bold">
              Archival Guarantee
            </p>
            <p className="text-xs text-[#525B56] leading-relaxed">
              Your family&apos;s cooking videos, original audio, and recipes are stored privately.
              We do not sell culinary recordings or train public commercial models on private family
              data.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-[#DDDCD3] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#7A857F]">
          <p>&copy; 2026 Simmory Culinary Archive. All rights reserved.</p>
          <p>Designed with care for families everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
