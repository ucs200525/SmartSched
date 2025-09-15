import { Plus, UserPlus, Building, Zap, ChevronRight } from "lucide-react";

interface QuickActionsProps {
  onAddCourse?: () => void;
  onRegisterFaculty?: () => void;
  onManageRooms?: () => void;
  onRunGeneration?: () => void;
}

export default function QuickActions({
  onAddCourse,
  onRegisterFaculty,
  onManageRooms,
  onRunGeneration,
}: QuickActionsProps) {
  const actions = [
    {
      icon: Plus,
      label: "Add New Course",
      onClick: onAddCourse,
      testId: "button-add-course",
    },
    {
      icon: UserPlus,
      label: "Register Faculty",
      onClick: onRegisterFaculty,
      testId: "button-register-faculty",
    },
    {
      icon: Building,
      label: "Manage Rooms",
      onClick: onManageRooms,
      testId: "button-manage-rooms",
    },
    {
      icon: Zap,
      label: "Run AI Generation",
      onClick: onRunGeneration,
      primary: true,
      testId: "button-run-ai-generation",
    },
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
      
      <div className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.onClick}
              className={`w-full flex items-center justify-between p-3 rounded-md text-sm group transition-colors ${
                action.primary
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border border-input hover:bg-muted"
              }`}
              data-testid={action.testId}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`h-4 w-4 ${
                  action.primary 
                    ? "text-primary-foreground" 
                    : "text-muted-foreground group-hover:text-foreground"
                }`} />
                <span>{action.label}</span>
              </div>
              <ChevronRight className={`h-4 w-4 ${
                action.primary 
                  ? "text-primary-foreground" 
                  : "text-muted-foreground"
              }`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
