
"use client";

import { useState } from "react";
import { useApp } from "@/hooks/use-app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function RoleSelection() {
  const { setEmployee, switchRole } = useApp();
  const [employeeName, setEmployeeName] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const { toast } = useToast();

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeName.trim()) {
      setEmployee(employeeName.trim());
      switchRole("employee");
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey !== 'admin@123') {
        toast({
            variant: "destructive",
            title: "Invalid Key",
            description: "The admin key you entered is incorrect.",
        });
        return;
    }
    switchRole("admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Vahicle App</CardTitle>
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
                <form onSubmit={handleAdminSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="adminKey">Admin Key</Label>
                        <Input
                            id="adminKey"
                            type="password"
                            placeholder="Enter admin key"
                            value={adminKey}
                            onChange={(e) => setAdminKey(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full">
                        <Shield className="mr-2 h-4 w-4" />
                        Proceed as Admin
                    </Button>
                </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
