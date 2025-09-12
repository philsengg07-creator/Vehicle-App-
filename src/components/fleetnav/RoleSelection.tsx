"use client";

import { useApp } from "@/hooks/use-app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User } from "lucide-react";
import type { UserRole } from "@/types";

export function RoleSelection() {
  const { switchRole } = useApp();

  const handleRoleSelect = (role: UserRole) => {
    switchRole(role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to FleetNav</CardTitle>
          <CardDescription>Please select your role to continue.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 p-6">
          <Button
            className="w-full h-24 text-lg"
            onClick={() => handleRoleSelect("employee")}
          >
            <User className="mr-2 h-6 w-6" />
            Employee
          </Button>
          <Button
            className="w-full h-24 text-lg"
            variant="outline"
            onClick={() => handleRoleSelect("admin")}
          >
            <Shield className="mr-2 h-6 w-6" />
            Admin
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
