"use client";

import { useApp } from "@/hooks/use-app";
import { User, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar";


export function RoleSwitcher() {
  const { role, switchRole, currentEmployeeId, logout } = useApp();

  const handleRoleChange = (newRole: "admin" | "employee") => {
    switchRole(newRole);
  };
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  }

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {role === 'admin' ? <Shield/> : getInitials(currentEmployeeId || 'E')}
                  </AvatarFallback>
              </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {role === 'admin' ? 'Admin' : currentEmployeeId}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {role === 'admin' ? 'admin@fleetnav.com' : `${currentEmployeeId.replace(' ', '.').toLowerCase()}@fleetnav.com`}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {role === 'employee' && (
            <DropdownMenuItem onClick={() => handleRoleChange('admin')}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Switch to Admin</span>
            </DropdownMenuItem>
          )}
          {role === 'admin' && (
            <DropdownMenuItem onClick={() => handleRoleChange('employee')}>
                <User className="mr-2 h-4 w-4" />
                <span>Switch to Employee</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
}
