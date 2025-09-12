"use client";

import { useApp } from "@/hooks/use-app";
import { User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

export function RoleSwitcher() {
  const { role, switchRole } = useApp();

  const handleRoleChange = (newRole: UserRole) => {
    switchRole(newRole);
  };

  return (
    <div className="flex items-center gap-1 rounded-full border bg-card p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleRoleChange("employee")}
        className={cn("rounded-full h-8 px-3 gap-2", role === "employee" && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
        aria-pressed={role === 'employee'}
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">Employee</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleRoleChange("admin")}
        className={cn("rounded-full h-8 px-3 gap-2", role === "admin" && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
        aria-pressed={role === 'admin'}
      >
        <Shield className="h-4 w-4" />
        <span className="hidden sm:inline">Admin</span>
      </Button>
    </div>
  );
}
