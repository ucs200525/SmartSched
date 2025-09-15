import { Bell } from "lucide-react";

interface TopHeaderProps {
  title: string;
  breadcrumb?: string[];
}

export default function TopHeader({ title, breadcrumb = [] }: TopHeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          {breadcrumb.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              {breadcrumb.map((item, index) => (
                <span key={index} className="flex items-center space-x-2">
                  {index > 0 && (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  )}
                  <span>{item}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <button 
            className="relative p-2 text-muted-foreground hover:text-foreground"
            data-testid="button-notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-destructive rounded-full">
              3
            </span>
          </button>
          
          {/* AI Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-secondary/10 rounded-full">
            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-secondary">AI Engine Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
