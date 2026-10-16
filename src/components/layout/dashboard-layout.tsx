import React, { Suspense } from "react";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { MobileNav } from "@/components/navigation/mobile-nav";

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F2F2EB] text-[#202723]">
      {/* Mobile Header / Navigation */}
      <Suspense fallback={<div className="h-16 lg:hidden border-b border-[#DDDCD3] bg-[#F2F2EB]" />}>
        <MobileNav />
      </Suspense>

      {/* Desktop App Sidebar */}
      <div className="hidden lg:block">
        <Suspense fallback={<aside className="w-64 border-r border-[#DDDCD3] bg-[#F2F2EB] shrink-0 h-screen sticky top-0" />}>
          <AppSidebar />
        </Suspense>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
