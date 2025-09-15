import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Extend Express Session interface
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: string;
  }
}
import { 
  insertUserSchema, 
  insertProgramSchema, 
  insertCourseSchema,
  insertFacultySchema,
  insertRoomSchema,
  insertTimeSlotSchema,
  insertStudentSchema,
  insertEnrollmentSchema,
  insertFacultyAssignmentSchema,
  insertTimetableSchema,
  insertTimetableEntrySchema,
  insertConflictSchema
} from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };

  const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.session.userRole || !roles.includes(req.session.userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;
      
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role, 
          firstName: user.firstName, 
          lastName: user.lastName 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role, 
          firstName: user.firstName, 
          lastName: user.lastName 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user info' });
    }
  });

  // User management
  app.post('/api/users', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      userData.password = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: 'Failed to create user' });
    }
  });

  // Program management
  app.get('/api/programs', requireAuth, async (req, res) => {
    try {
      const programs = await storage.getPrograms();
      res.json(programs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch programs' });
    }
  });

  app.post('/api/programs', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const programData = insertProgramSchema.parse(req.body);
      const program = await storage.createProgram(programData);
      res.json(program);
    } catch (error) {
      res.status(400).json({ message: 'Failed to create program' });
    }
  });

  app.put('/api/programs/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const programData = insertProgramSchema.partial().parse(req.body);
      const program = await storage.updateProgram(req.params.id, programData);
      if (!program) {
        return res.status(404).json({ message: 'Program not found' });
      }
      res.json(program);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update program' });
    }
  });

  app.delete('/api/programs/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const success = await storage.deleteProgram(req.params.id);
      if (!success) {
        return res.status(404).json({ message: 'Program not found' });
      }
      res.json({ message: 'Program deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete program' });
    }
  });

  // Course management
  app.get('/api/courses', requireAuth, async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch courses' });
    }
  });

  app.get('/api/courses/program/:programId', requireAuth, async (req, res) => {
    try {
      const courses = await storage.getCoursesByProgram(req.params.programId);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch courses' });
    }
  });

  app.post('/api/courses', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.json(course);
    } catch (error) {
      res.status(400).json({ message: 'Failed to create course' });
    }
  });

  app.put('/api/courses/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const courseData = insertCourseSchema.partial().parse(req.body);
      const course = await storage.updateCourse(req.params.id, courseData);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      res.json(course);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update course' });
    }
  });

  app.delete('/api/courses/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const success = await storage.deleteCourse(req.params.id);
      if (!success) {
        return res.status(404).json({ message: 'Course not found' });
      }
      res.json({ message: 'Course deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete course' });
    }
  });

  // Faculty management
  app.get('/api/faculty', requireAuth, async (req, res) => {
    try {
      const faculty = await storage.getFaculty();
      res.json(faculty);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch faculty' });
    }
  });

  app.post('/api/faculty', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const facultyData = insertFacultySchema.parse(req.body);
      const faculty = await storage.createFaculty(facultyData);
      res.json(faculty);
    } catch (error) {
      res.status(400).json({ message: 'Failed to create faculty' });
    }
  });

  app.get('/api/faculty/me', requireAuth, requireRole(['faculty']), async (req, res) => {
    try {
      const faculty = await storage.getFacultyByUser(req.session.userId!);
      if (!faculty) {
        return res.status(404).json({ message: 'Faculty profile not found' });
      }
      const assignments = await storage.getFacultyAssignmentsByFaculty(faculty.id);
      res.json({ ...faculty, assignments });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch faculty profile' });
    }
  });

  // Room management
  app.get('/api/rooms', requireAuth, async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch rooms' });
    }
  });

  app.post('/api/rooms', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData);
      res.json(room);
    } catch (error) {
      res.status(400).json({ message: 'Failed to create room' });
    }
  });

  // Time slots
  app.get('/api/time-slots', requireAuth, async (req, res) => {
    try {
      const timeSlots = await storage.getTimeSlots();
      res.json(timeSlots);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch time slots' });
    }
  });

  // Student management
  app.get('/api/students/me', requireAuth, requireRole(['student']), async (req, res) => {
    try {
      const student = await storage.getStudentByUser(req.session.userId!);
      if (!student) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      const enrollments = await storage.getEnrollmentsByStudent(student.id);
      res.json({ ...student, enrollments });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch student profile' });
    }
  });

  // Enrollment management
  app.post('/api/enrollments', requireAuth, requireRole(['admin', 'student']), async (req, res) => {
    try {
      const enrollmentData = insertEnrollmentSchema.parse(req.body);
      const enrollment = await storage.createEnrollment(enrollmentData);
      res.json(enrollment);
    } catch (error) {
      res.status(400).json({ message: 'Failed to create enrollment' });
    }
  });

  // Timetable management
  app.get('/api/timetables', requireAuth, async (req, res) => {
    try {
      const timetables = await storage.getTimetables();
      res.json(timetables);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch timetables' });
    }
  });

  app.post('/api/timetables', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const timetableData = insertTimetableSchema.parse(req.body);
      const timetable = await storage.createTimetable(timetableData);
      res.json(timetable);
    } catch (error) {
      res.status(400).json({ message: 'Failed to create timetable' });
    }
  });

  app.get('/api/timetables/:id/entries', requireAuth, async (req, res) => {
    try {
      const entries = await storage.getTimetableEntries(req.params.id);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch timetable entries' });
    }
  });

  app.post('/api/timetables/:id/generate', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      // This would call the Python AI engine in a real implementation
      // For now, we'll simulate the process
      const timetableId = req.params.id;
      
      // Simulated AI generation logic
      const courses = await storage.getCourses();
      const faculty = await storage.getFaculty();
      const rooms = await storage.getRooms();
      const timeSlots = await storage.getTimeSlots();
      
      // Generate some entries (simplified example)
      const entries = [];
      for (let i = 0; i < Math.min(5, courses.length); i++) {
        const course = courses[i];
        const randomFaculty = faculty[Math.floor(Math.random() * faculty.length)];
        const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
        const randomSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        
        if (randomFaculty && randomRoom && randomSlot) {
          const entry = await storage.createTimetableEntry({
            timetableId,
            courseId: course.id,
            facultyId: randomFaculty.id,
            roomId: randomRoom.id,
            timeSlotId: randomSlot.id,
            section: 'A',
            studentCount: Math.floor(Math.random() * 50) + 10
          });
          entries.push(entry);
        }
      }
      
      // Check for conflicts and create them
      const conflicts = await checkForConflicts(timetableId, entries);
      for (const conflict of conflicts) {
        await storage.createConflict(conflict);
      }
      
      res.json({ 
        message: 'Timetable generated successfully', 
        entries, 
        conflictsFound: conflicts.length 
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate timetable' });
    }
  });

  // Conflict management
  app.get('/api/conflicts', requireAuth, async (req, res) => {
    try {
      const timetableId = req.query.timetableId as string;
      const conflicts = await storage.getConflicts(timetableId);
      res.json(conflicts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch conflicts' });
    }
  });

  app.put('/api/conflicts/:id/resolve', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const { resolution } = req.body;
      const conflict = await storage.updateConflict(req.params.id, {
        status: 'resolved',
        resolvedBy: req.session.userId
      });
      if (!conflict) {
        return res.status(404).json({ message: 'Conflict not found' });
      }
      res.json(conflict);
    } catch (error) {
      res.status(500).json({ message: 'Failed to resolve conflict' });
    }
  });

  // Dashboard statistics
  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      const programs = await storage.getPrograms();
      const courses = await storage.getCourses();
      const faculty = await storage.getFaculty();
      const students = await storage.getStudents();
      const conflicts = await storage.getConflicts();
      
      const stats = {
        totalPrograms: programs.length,
        totalCourses: courses.length,
        activeFaculty: faculty.length,
        enrolledStudents: students.length,
        openConflicts: conflicts.filter(c => c.status === 'open').length,
        efficiency: Math.max(85, Math.floor(Math.random() * 15) + 85) // Simulated efficiency score
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to check for conflicts
async function checkForConflicts(timetableId: string, entries: any[]): Promise<any[]> {
  const conflicts = [];
  
  // Check for room double booking
  const roomSlotMap = new Map();
  for (const entry of entries) {
    const key = `${entry.roomId}-${entry.timeSlotId}`;
    if (roomSlotMap.has(key)) {
      conflicts.push({
        timetableId,
        type: 'room_double_booking',
        severity: 'high',
        description: `Room ${entry.roomId} is double booked for time slot ${entry.timeSlotId}`,
        affectedEntries: [roomSlotMap.get(key), entry.id],
        status: 'open',
        resolutionSuggestions: [
          {
            type: 'move_to_different_room',
            description: 'Move one of the classes to an available room',
            priority: 1
          }
        ]
      });
    } else {
      roomSlotMap.set(key, entry.id);
    }
  }
  
  // Check for faculty overload (simplified)
  const facultyHours = new Map();
  for (const entry of entries) {
    const current = facultyHours.get(entry.facultyId) || 0;
    facultyHours.set(entry.facultyId, current + 1);
  }
  
  for (const [facultyId, hours] of Array.from(facultyHours.entries())) {
    if (hours > 15) { // Assuming 15 hours max per week
      conflicts.push({
        timetableId,
        type: 'faculty_overload',
        severity: 'medium',
        description: `Faculty ${facultyId} is assigned ${hours} hours, exceeding the 15-hour limit`,
        affectedEntries: entries.filter(e => e.facultyId === facultyId).map(e => e.id),
        status: 'open',
        resolutionSuggestions: [
          {
            type: 'redistribute_courses',
            description: 'Redistribute some courses to other qualified faculty',
            priority: 1
          }
        ]
      });
    }
  }
  
  return conflicts;
}
