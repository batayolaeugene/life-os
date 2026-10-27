import React from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { QueryProvider } from "@/components/providers/query-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20">
        <OfflineBanner />
        <div className="flex flex-1">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <Header />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </QueryProvider>
  );
}
