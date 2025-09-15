import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import TopHeader from "@/components/layout/top-header";
import StatsCards from "@/components/dashboard/stats-cards";
import TimetableGrid from "@/components/timetable/timetable-grid";
import RecentActivity from "@/components/dashboard/recent-activity";
import QuickActions from "@/components/dashboard/quick-actions";
import ConflictModal from "@/components/timetable/conflict-modal";

export default function AdminDashboard() {
  const [currentRole, setCurrentRole] = useState("admin");
  const [, setLocation] = useLocation();
  const [selectedConflict, setSelectedConflict] = useState<any>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  const { data: conflicts } = useQuery({
    queryKey: ['/api/conflicts'],
  });

  const handleRoleChange = (role: string) => {
    setCurrentRole(role);
    setLocation(`/${role}`);
  };

  const handleTimetableCellClick = (entry: any) => {
    if (entry.hasConflict) {
      const conflict = conflicts?.find((c: any) => 
        c.affectedEntries?.includes(entry.id)
      );
      if (conflict) {
        setSelectedConflict(conflict);
        setIsConflictModalOpen(true);
      }
    }
  };

  const handleQuickActions = {
    onAddCourse: () => setLocation("/courses"),
    onRegisterFaculty: () => setLocation("/faculty-management"),
    onManageRooms: () => setLocation("/rooms"),
    onRunGeneration: () => setLocation("/timetable"),
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar currentRole={currentRole} onRoleChange={handleRoleChange} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopHeader 
          title="Admin Dashboard" 
          breadcrumb={["Dashboard", "Overview"]} 
        />
        
        <div className="flex-1 overflow-auto p-6 bg-muted/30">
          <StatsCards />
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2">
              <TimetableGrid 
                onCellClick={handleTimetableCellClick}
              />
            </div>
            
            <div className="space-y-6">
              {/* Conflict Resolution Widget */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-foreground mb-4">Conflict Resolution</h3>
                
                <div className="space-y-4">
                  {conflicts?.slice(0, 3).map((conflict: any) => (
                    <div 
                      key={conflict.id}
                      className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                        conflict.severity === 'high' ? 'border-destructive/20 bg-destructive/5' :
                        conflict.severity === 'medium' ? 'border-accent/20 bg-accent/5' :
                        'border-primary/20 bg-primary/5'
                      }`}
                      onClick={() => {
                        setSelectedConflict(conflict);
                        setIsConflictModalOpen(true);
                      }}
                      data-testid={`conflict-${conflict.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-foreground">
                            {conflict.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {conflict.description}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          conflict.severity === 'high' ? 'bg-destructive text-destructive-foreground' :
                          conflict.severity === 'medium' ? 'bg-accent text-accent-foreground' :
                          'bg-primary text-primary-foreground'
                        }`}>
                          {conflict.severity}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center space-x-2">
                        <button className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-md hover:bg-secondary/90">
                          Auto-Resolve
                        </button>
                        <button className="px-3 py-1 border border-input text-xs rounded-md hover:bg-muted">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  className="w-full mt-4 px-4 py-2 border border-input rounded-md text-sm hover:bg-muted"
                  onClick={() => setLocation("/conflicts")}
                  data-testid="button-view-all-conflicts"
                >
                  View All Conflicts ({conflicts?.length || 0})
                </button>
              </div>
              
              <RecentActivity />
              <QuickActions {...handleQuickActions} />
            </div>
          </div>
        </div>
      </main>

      <ConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        conflict={selectedConflict}
        onResolve={(solution) => {
          console.log("Applying solution:", solution);
          // In a real app, this would call the API to resolve the conflict
        }}
      />
    </div>
  );
}
