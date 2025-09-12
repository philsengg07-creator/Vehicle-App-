"use client";

import { useState } from "react";
import { useApp } from "@/hooks/use-app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export function RoleSelection() {
  const { setEmployee, switchRole } = useApp();
  const [employeeName, setEmployeeName] = useState('');

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeName.trim()) {
      setEmployee(employeeName.trim());
      switchRole("employee");
    }
  };

  const handleAdminSelect = () => {
    switchRole("admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to FleetNav</CardTitle>
          <CardDescription>Please select your role to continue.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="employee" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="employee"><User className="mr-2 h-4 w-4" />Employee</TabsTrigger>
              <TabsTrigger value="admin"><Shield className="mr-2 h-4 w-4" />Admin</TabsTrigger>
            </TabsList>
            <TabsContent value="employee" className="pt-6">
              <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="employeeName">Your Name</Label>
                    <Input 
                        id="employeeName"
                        placeholder="e.g., Jane Doe"
                        value={employeeName}
                        onChange={(e) => setEmployeeName(e.target.value)}
                        required
                    />
                </div>
                <Button type="submit" className="w-full">
                  Continue as Employee
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="admin" className="pt-6">
                <Button
                    className="w-full h-24 text-lg"
                    variant="outline"
                    onClick={handleAdminSelect}
                >
                    <Shield className="mr-2 h-6 w-6" />
                    Proceed as Admin
                </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
