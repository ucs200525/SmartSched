import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/auth-context";
import AdminDashboard from "@/pages/admin-dashboard";
import FacultyDashboard from "@/pages/faculty-dashboard";
import StudentDashboard from "@/pages/student-dashboard";
import CourseManagement from "@/pages/course-management";
import FacultyManagement from "@/pages/faculty-management";
import RoomManagement from "@/pages/room-management";
import TimetableGeneration from "@/pages/timetable-generation";
import ConflictResolution from "@/pages/conflict-resolution";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AdminDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/faculty" component={FacultyDashboard} />
      <Route path="/student" component={StudentDashboard} />
      <Route path="/courses" component={CourseManagement} />
      <Route path="/faculty-management" component={FacultyManagement} />
      <Route path="/rooms" component={RoomManagement} />
      <Route path="/timetable" component={TimetableGeneration} />
      <Route path="/conflicts" component={ConflictResolution} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
