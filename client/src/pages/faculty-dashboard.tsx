import { useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import TopHeader from "@/components/layout/top-header";

export default function FacultyDashboard() {
  const [currentRole, setCurrentRole] = useState("faculty");
  const [, setLocation] = useLocation();

  const handleRoleChange = (role: string) => {
    setCurrentRole(role);
    setLocation(`/${role}`);
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar currentRole={currentRole} onRoleChange={handleRoleChange} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopHeader 
          title="Faculty Dashboard" 
          breadcrumb={["Faculty", "Dashboard"]} 
        />
        
        <div className="flex-1 overflow-auto p-6 bg-muted/30">
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Faculty Dashboard
            </h2>
            <p className="text-muted-foreground">
              Faculty dashboard functionality will be implemented here.
              This will include personal schedules, workload summaries, and availability management.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
