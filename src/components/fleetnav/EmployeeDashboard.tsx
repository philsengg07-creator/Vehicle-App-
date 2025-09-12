"use client";

import { useApp } from "@/hooks/use-app";
import { TaxiCard } from "./TaxiCard";

export function EmployeeDashboard() {
  const { taxis } = useApp();
  
  return (
    <div className="py-8">
      <div>
        <h2 className="text-2xl font-bold font-headline mb-6">Available Taxis</h2>
        
        {taxis.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {taxis.map((taxi) => (
              <TaxiCard key={taxi.id} taxi={taxi} onEdit={() => {}} />
            ))}
          </div>
        ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold">No Taxis Available</h3>
                <p className="text-muted-foreground mt-1">Please check back later.</p>
            </div>
        )}
      </div>
    </div>
  );
}
