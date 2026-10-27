"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Boxes,
  CheckSquare,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/expenses", label: "Cash Flow & Budget", icon: Wallet },
  { href: "/inventory", label: "Household Stock", icon: Boxes },
  { href: "/tasks", label: "Daily Routines", icon: CheckSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-md flex flex-col justify-between shrink-0 h-screen sticky top-0 hidden md:flex">
      <div>
        <div className="h-16 flex items-center px-6 border-b border-border gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold tracking-tight text-lg shadow-sm">
            Ω
          </div>
          <div>
            <h1 className="font-bold text-base leading-none tracking-tight">LifeOS</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">
              Command Center
            </p>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border">
        <div className="p-3 rounded-lg bg-muted/50 border border-border/60 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="overflow-hidden text-xs">
            <p className="font-semibold text-foreground truncate">Offline-Ready</p>
            <p className="text-muted-foreground text-[10px] truncate">
              IndexedDB + Drizzle
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
