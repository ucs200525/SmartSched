import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { 
  Home, 
  BookOpen, 
  Users, 
  Building, 
  Calendar, 
  AlertTriangle,
  ChevronRight,
  User
} from "lucide-react";

interface SidebarProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
}

export default function Sidebar({ currentRole, onRoleChange }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const adminNavItems = [
    { href: "/admin", icon: Home, label: "Dashboard" },
    { href: "/courses", icon: BookOpen, label: "Course Management" },
    { href: "/faculty-management", icon: Users, label: "Faculty Management" },
    { href: "/rooms", icon: Building, label: "Room & Lab Management" },
    { href: "/timetable", icon: Calendar, label: "Generate Timetable" },
    { href: "/conflicts", icon: AlertTriangle, label: "Conflict Resolution" },
  ];

  const facultyNavItems = [
    { href: "/faculty", icon: Home, label: "Dashboard" },
    { href: "/faculty/schedule", icon: Calendar, label: "My Schedule" },
    { href: "/faculty/workload", icon: Users, label: "Workload Summary" },
  ];

  const studentNavItems = [
    { href: "/student", icon: Home, label: "Dashboard" },
    { href: "/student/enroll", icon: BookOpen, label: "Course Selection" },
    { href: "/student/timetable", icon: Calendar, label: "My Timetable" },
  ];

  const getNavItems = () => {
    switch (currentRole) {
      case "faculty":
        return facultyNavItems;
      case "student":
        return studentNavItems;
      default:
        return adminNavItems;
    }
  };

  const isActive = (href: string) => {
    if (href === "/admin" && (location === "/" || location === "/admin")) return true;
    return location === href;
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary">EduSchedule Pro</h1>
        <p className="text-sm text-muted-foreground mt-1">NEP 2020 Timetable System</p>
      </div>
      
      {/* Role Switcher */}
      <div className="p-4 border-b border-border">
        <label className="text-sm font-medium text-foreground">Switch Role</label>
        <select 
          className="w-full mt-2 p-2 border border-input rounded-md bg-background text-sm"
          value={currentRole}
          onChange={(e) => onRoleChange(e.target.value)}
          data-testid="select-role"
        >
          <option value="admin">System Administrator</option>
          <option value="faculty">Faculty Member</option>
          <option value="student">Student Portal</option>
        </select>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {getNavItems().map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  active 
                    ? "bg-primary/10 text-primary border-r-3 border-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {user ? `${user.firstName} ${user.lastName}` : "User"}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {currentRole.replace('_', ' ')}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full mt-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-input rounded-md hover:bg-muted"
          data-testid="button-logout"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
