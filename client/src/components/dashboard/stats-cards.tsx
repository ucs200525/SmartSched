import { useQuery } from "@tanstack/react-query";
import { BookOpen, Users, GraduationCap, BarChart3 } from "lucide-react";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg border border-border p-6 shadow-sm animate-pulse">
            <div className="h-16 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const cardData = [
    {
      title: "Total Programs",
      value: stats?.totalPrograms || 0,
      subtitle: "B.Ed, M.Ed, FYUP, ITEP",
      icon: BookOpen,
      color: "primary",
    },
    {
      title: "Active Faculty",
      value: stats?.activeFaculty || 0,
      subtitle: "+12 this semester",
      icon: Users,
      color: "secondary",
    },
    {
      title: "Enrolled Students",
      value: stats?.enrolledStudents || 0,
      subtitle: `${stats?.openConflicts || 0} conflicts detected`,
      icon: GraduationCap,
      color: "accent",
    },
    {
      title: "Timetable Efficiency",
      value: `${stats?.efficiency || 0}%`,
      subtitle: "AI Optimization Score",
      icon: BarChart3,
      color: "primary",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {cardData.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-3xl font-bold text-foreground" data-testid={`stat-${card.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {card.value}
                </p>
                <p className={`text-sm font-medium ${
                  card.subtitle.includes('conflicts') ? 'text-destructive' : 'text-secondary'
                }`}>
                  {card.subtitle}
                </p>
              </div>
              <div className={`p-3 bg-${card.color}/10 rounded-full`}>
                <Icon className={`h-6 w-6 text-${card.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
