'use client';

import { AppProvider } from '@/context/AppContext';
import { useApp } from '@/hooks/use-app';
import { Header } from '@/components/fleetnav/Header';
import { AdminDashboard } from '@/components/fleetnav/AdminDashboard';
import { EmployeeDashboard } from '@/components/fleetnav/EmployeeDashboard';

function FleetNavApp() {
  const { role } = useApp();

  return (
    <div className="min-h-screen bg-background text-foreground">
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
