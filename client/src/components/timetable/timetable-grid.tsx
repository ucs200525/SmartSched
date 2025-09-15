import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface TimetableEntry {
  id: string;
  course: {
    name: string;
    code: string;
    type: string;
  };
  faculty: {
    name: string;
  };
  room: {
    name: string;
    capacity: number;
  };
  timeSlot: {
    startTime: string;
    endTime: string;
    day: string;
  };
  studentCount: number;
  hasConflict?: boolean;
}

interface TimetableGridProps {
  timetableId?: string;
  onCellClick?: (entry: TimetableEntry) => void;
}

export default function TimetableGrid({ timetableId, onCellClick }: TimetableGridProps) {
  const [selectedProgram, setSelectedProgram] = useState("all");

  const { data: timeSlots } = useQuery({
    queryKey: ['/api/time-slots'],
  });

  const { data: entries } = useQuery({
    queryKey: ['/api/timetables', timetableId, 'entries'],
    enabled: !!timetableId,
  });

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const timeSlotsByDay = timeSlots?.reduce((acc: any, slot: any) => {
    if (!acc[slot.day]) acc[slot.day] = [];
    acc[slot.day].push(slot);
    return acc;
  }, {}) || {};

  // Sort time slots by slot number
  days.forEach(day => {
    if (timeSlotsByDay[day]) {
      timeSlotsByDay[day].sort((a: any, b: any) => a.slotNumber - b.slotNumber);
    }
  });

  const getEntryForSlot = (day: string, slotId: string) => {
    return entries?.find((entry: any) => 
      entry.timeSlot?.day === day && entry.timeSlot?.id === slotId
    );
  };

  const getCourseBlockClass = (entry: any) => {
    let classes = "course-block";
    if (entry?.hasConflict) classes += " conflict-block";
    if (entry?.course?.type === "lab") classes += " lab-block";
    return classes;
  };

  const uniqueTimeSlots = timeSlotsByDay[days[0]] || [];

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Master Timetable Overview</h3>
        <div className="flex items-center space-x-2">
          <select 
            className="px-3 py-1 border border-input rounded-md bg-background text-sm"
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            data-testid="select-program-filter"
          >
            <option value="all">All Programs</option>
            <option value="bed">B.Ed Program</option>
            <option value="med">M.Ed Program</option>
            <option value="fyup">FYUP Program</option>
            <option value="itep">ITEP Program</option>
          </select>
          <button 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            data-testid="button-generate-new"
          >
            Generate New
          </button>
        </div>
      </div>
      
      {/* Timetable Grid */}
      <div className="timetable-grid rounded-lg overflow-hidden border border-border">
        {/* Headers */}
        <div className="time-slot">Time</div>
        {days.map(day => (
          <div key={day} className="day-header">
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </div>
        ))}
        
        {/* Time slots and entries */}
        {uniqueTimeSlots.map((timeSlot: any) => (
          <div key={timeSlot.id} className="contents">
            <div className="time-slot">
              {timeSlot.startTime}-{timeSlot.endTime}
            </div>
            {days.map(day => {
              const daySlot = timeSlotsByDay[day]?.find((s: any) => s.slotNumber === timeSlot.slotNumber);
              const entry = daySlot ? getEntryForSlot(day, daySlot.id) : null;
              
              if (entry) {
                return (
                  <div
                    key={`${day}-${timeSlot.id}`}
                    className={getCourseBlockClass(entry)}
                    onClick={() => onCellClick?.(entry)}
                    data-testid={`timetable-entry-${day}-${timeSlot.slotNumber}`}
                  >
                    <div className="text-sm font-semibold text-foreground">
                      {entry.course?.name || 'Unknown Course'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.faculty?.name || 'No Faculty'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.room?.name || 'No Room'} • {entry.studentCount || 0} students
                    </div>
                    {entry.hasConflict && (
                      <div className="text-xs text-destructive">⚠ Conflict Detected</div>
                    )}
                  </div>
                );
              }
              
              return (
                <div 
                  key={`${day}-${timeSlot.id}`} 
                  className="empty-slot"
                  data-testid={`timetable-empty-${day}-${timeSlot.slotNumber}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Legend and Export */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-secondary rounded"></div>
            <span className="text-muted-foreground">Theory Classes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-accent rounded"></div>
            <span className="text-muted-foreground">Lab Sessions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-destructive rounded"></div>
            <span className="text-muted-foreground">Conflicts</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="px-3 py-1 border border-input rounded-md text-sm hover:bg-muted"
            data-testid="button-export-pdf"
          >
            Export PDF
          </button>
          <button 
            className="px-3 py-1 border border-input rounded-md text-sm hover:bg-muted"
            data-testid="button-export-excel"
          >
            Export Excel
          </button>
        </div>
      </div>
    </div>
  );
}
