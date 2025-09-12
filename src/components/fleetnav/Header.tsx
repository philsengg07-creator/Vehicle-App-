"use client";

import { Car } from "lucide-react";
import { RoleSwitcher } from "./RoleSwitcher";
import { Notifications } from "./Notifications";
import { useApp } from "@/hooks/use-app";

export function Header() {
  const { role } = useApp();
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <Car className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight font-headline">FleetNav</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <RoleSwitcher />
          {role === 'admin' && <Notifications />}
        </div>
      </div>
    </header>
  );
}
