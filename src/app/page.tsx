'use client';

import { AppProvider } from '@/context/AppContext';
import { useApp } from '@/hooks/use-app';
import { Header } from '@/components/fleetnav/Header';
import { AdminDashboard } from '@/components/fleetnav/AdminDashboard';
import { EmployeeDashboard } from '@/components/fleetnav/EmployeeDashboard';
import { RoleSelection } from '@/components/fleetnav/RoleSelection';
import { PushNotifications } from '@/components/fleetnav/PushNotifications';

function FleetNavApp() {
  const { role, currentEmployeeId } = useApp();

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
