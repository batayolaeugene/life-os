"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Boxes, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/expenses", label: "Cash Flow", icon: Wallet },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/tasks", label: "Routines", icon: CheckSquare },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="h-16 border-b border-border bg-card/40 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2 md:hidden">
        <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
          Ω
        </div>
        <span className="font-bold text-sm">LifeOS</span>
      </div>

      <nav className="flex md:hidden items-center gap-1 overflow-x-auto py-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "p-2 rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
              title={item.label}
            >
              <Icon className="w-4 h-4" />
            </Link>
          );
        })}
      </nav>

      <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
        <span>Session:</span>
        <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground">
          Local / Production Active
        </span>
      </div>
    </header>
  );
}
