'use client';

import { AppProvider } from '@/context/AppContext';
import { useApp } from '@/hooks/use-app';
import { Header } from '@/components/fleetnav/Header';
import { AdminDashboard } from '@/components/fleetnav/AdminDashboard';
import { EmployeeDashboard } from '@/components/fleetnav/EmployeeDashboard';
import { RoleSelection } from '@/components/fleetnav/RoleSelection';
import { PushNotifications } from '@/components/fleetnav/PushNotifications';
import { Loader2 } from 'lucide-react';

function FleetNavApp() {
  const { role, currentEmployeeId, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Initializing App...</p>
      </div>
    );
  }

  if (!role || (role === 'employee' && !currentEmployeeId)) {
    return <RoleSelection />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PushNotifications />
      <Header />
      <main className="container mx-auto px-4">
        {role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <FleetNavApp />
    </AppProvider>
  );
}
