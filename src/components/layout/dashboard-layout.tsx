import React, { Suspense } from "react";
import { AppNavbar } from "@/components/navigation/app-navbar";

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F2F2EB] text-[#202723] pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-12 selection:bg-[#2E4742] selection:text-cream-card">
      {/* Top Application Navigation Bar */}
      <Suspense fallback={<div className="h-20 border-b border-[#DDDCD3] bg-cream-card" />}>
        <AppNavbar />
      </Suspense>

      {/* Main Content Canvas (Spacious, full width, cookbook-first) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
