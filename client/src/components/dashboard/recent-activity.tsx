import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Plus, AlertTriangle, Wrench } from "lucide-react";

export default function RecentActivity() {
  // In a real app, this would fetch from an API
  const activities = [
    {
      id: 1,
      type: "success",
      message: "AI Engine generated timetable for M.Ed Semester 3",
      timestamp: "2 minutes ago",
      icon: CheckCircle,
    },
    {
      id: 2,
      type: "warning",
      message: "Dr. Priya Sharma requested schedule modification",
      timestamp: "15 minutes ago",
      icon: Plus,
    },
    {
      id: 3,
      type: "info",
      message: 'New course "Digital Pedagogy" added to curriculum',
      timestamp: "1 hour ago",
      icon: Plus,
    },
    {
      id: 4,
      type: "alert",
      message: "Room 301 maintenance scheduled",
      timestamp: "3 hours ago",
      icon: Wrench,
    },
  ];

  const getIconColor = (type: string) => {
    switch (type) {
      case "success": return "text-secondary";
      case "warning": return "text-accent";
      case "info": return "text-primary";
      case "alert": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case "success": return "bg-secondary/10";
      case "warning": return "bg-accent/10";
      case "info": return "bg-primary/10";
      case "alert": return "bg-destructive/10";
      default: return "bg-muted/10";
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
      
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 ${getBackgroundColor(activity.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-4 w-4 ${getIconColor(activity.type)}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  {activity.message}
                </p>
                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      <button 
        className="w-full mt-4 px-4 py-2 border border-input rounded-md text-sm hover:bg-muted"
        data-testid="button-view-activity-log"
      >
        View Activity Log
      </button>
    </div>
  );
}
