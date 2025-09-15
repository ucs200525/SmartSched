import { 
  type User, 
  type InsertUser, 
  type Program, 
  type InsertProgram,
  type Course,
  type InsertCourse,
  type Faculty,
  type InsertFaculty,
  type Room,
  type InsertRoom,
  type TimeSlot,
  type InsertTimeSlot,
  type Student,
  type InsertStudent,
  type Enrollment,
  type InsertEnrollment,
  type FacultyAssignment,
  type InsertFacultyAssignment,
  type Timetable,
  type InsertTimetable,
  type TimetableEntry,
  type InsertTimetableEntry,
  type Conflict,
  type InsertConflict
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Program management
  getPrograms(): Promise<Program[]>;
  getProgram(id: string): Promise<Program | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: string, program: Partial<InsertProgram>): Promise<Program | undefined>;
  deleteProgram(id: string): Promise<boolean>;
  
  // Course management
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  getCoursesByProgram(programId: string): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<boolean>;
  
  // Faculty management
  getFaculty(): Promise<Faculty[]>;
  getFacultyMember(id: string): Promise<Faculty | undefined>;
  getFacultyByUser(userId: string): Promise<Faculty | undefined>;
  createFaculty(faculty: InsertFaculty): Promise<Faculty>;
  updateFaculty(id: string, faculty: Partial<InsertFaculty>): Promise<Faculty | undefined>;
  deleteFaculty(id: string): Promise<boolean>;
  
  // Room management
  getRooms(): Promise<Room[]>;
  getRoom(id: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: string, room: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: string): Promise<boolean>;
  
  // Time slot management
  getTimeSlots(): Promise<TimeSlot[]>;
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  
  // Student management
  getStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByUser(userId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  
  // Enrollment management
  getEnrollments(): Promise<Enrollment[]>;
  getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  
  // Faculty assignment management
  getFacultyAssignments(): Promise<FacultyAssignment[]>;
  getFacultyAssignmentsByFaculty(facultyId: string): Promise<FacultyAssignment[]>;
  createFacultyAssignment(assignment: InsertFacultyAssignment): Promise<FacultyAssignment>;
  
  // Timetable management
  getTimetables(): Promise<Timetable[]>;
  getTimetable(id: string): Promise<Timetable | undefined>;
  createTimetable(timetable: InsertTimetable): Promise<Timetable>;
  updateTimetable(id: string, timetable: Partial<InsertTimetable>): Promise<Timetable | undefined>;
  
  // Timetable entry management
  getTimetableEntries(timetableId: string): Promise<TimetableEntry[]>;
  createTimetableEntry(entry: InsertTimetableEntry): Promise<TimetableEntry>;
  
  // Conflict management
  getConflicts(timetableId?: string): Promise<Conflict[]>;
  createConflict(conflict: InsertConflict): Promise<Conflict>;
  updateConflict(id: string, conflict: Partial<InsertConflict>): Promise<Conflict | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private programs: Map<string, Program> = new Map();
  private courses: Map<string, Course> = new Map();
  private faculty: Map<string, Faculty> = new Map();
  private rooms: Map<string, Room> = new Map();
  private timeSlots: Map<string, TimeSlot> = new Map();
  private students: Map<string, Student> = new Map();
  private enrollments: Map<string, Enrollment> = new Map();
  private facultyAssignments: Map<string, FacultyAssignment> = new Map();
  private timetables: Map<string, Timetable> = new Map();
  private timetableEntries: Map<string, TimetableEntry> = new Map();
  private conflicts: Map<string, Conflict> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize with some basic structure for NEP 2020
    const defaultPrograms = [
      { id: '1', name: 'Bachelor of Education', code: 'B.Ed', description: 'Four Year Undergraduate Programme in Education', duration: 4, isActive: true },
      { id: '2', name: 'Master of Education', code: 'M.Ed', description: 'Two Year Postgraduate Programme in Education', duration: 4, isActive: true },
      { id: '3', name: 'Four Year Undergraduate Programme', code: 'FYUP', description: 'Multidisciplinary Undergraduate Programme', duration: 8, isActive: true },
      { id: '4', name: 'Integrated Teacher Education Programme', code: 'ITEP', description: 'Integrated Teacher Education Programme', duration: 8, isActive: true },
    ];

    defaultPrograms.forEach(program => this.programs.set(program.id, program));

    // Initialize time slots
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const slots = [
      { startTime: '08:30', endTime: '09:25' },
      { startTime: '09:30', endTime: '10:25' },
      { startTime: '10:30', endTime: '11:25' },
      { startTime: '11:30', endTime: '12:25' },
      { startTime: '12:30', endTime: '13:25' },
      { startTime: '14:30', endTime: '15:25' },
      { startTime: '15:30', endTime: '16:25' },
      { startTime: '16:30', endTime: '17:25' },
    ];

    let slotId = 1;
    days.forEach(day => {
      slots.forEach((slot, index) => {
        this.timeSlots.set(slotId.toString(), {
          id: slotId.toString(),
          startTime: slot.startTime,
          endTime: slot.endTime,
          day,
          slotNumber: index + 1,
          isActive: true,
        });
        slotId++;
      });
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Program methods
  async getPrograms(): Promise<Program[]> {
    return Array.from(this.programs.values()).filter(p => p.isActive);
  }

  async getProgram(id: string): Promise<Program | undefined> {
    return this.programs.get(id);
  }

  async createProgram(insertProgram: InsertProgram): Promise<Program> {
    const id = randomUUID();
    const program: Program = { ...insertProgram, id };
    this.programs.set(id, program);
    return program;
  }

  async updateProgram(id: string, programUpdate: Partial<InsertProgram>): Promise<Program | undefined> {
    const program = this.programs.get(id);
    if (!program) return undefined;
    const updatedProgram = { ...program, ...programUpdate };
    this.programs.set(id, updatedProgram);
    return updatedProgram;
  }

  async deleteProgram(id: string): Promise<boolean> {
    return this.programs.delete(id);
  }

  // Course methods
  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(c => c.isActive);
  }

  async getCourse(id: string): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCoursesByProgram(programId: string): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(c => c.programId === programId && c.isActive);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = randomUUID();
    const course: Course = { ...insertCourse, id };
    this.courses.set(id, course);
    return course;
  }

  async updateCourse(id: string, courseUpdate: Partial<InsertCourse>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    const updatedCourse = { ...course, ...courseUpdate };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: string): Promise<boolean> {
    return this.courses.delete(id);
  }

  // Faculty methods
  async getFaculty(): Promise<Faculty[]> {
    return Array.from(this.faculty.values()).filter(f => f.isActive);
  }

  async getFacultyMember(id: string): Promise<Faculty | undefined> {
    return this.faculty.get(id);
  }

  async getFacultyByUser(userId: string): Promise<Faculty | undefined> {
    return Array.from(this.faculty.values()).find(f => f.userId === userId);
  }

  async createFaculty(insertFaculty: InsertFaculty): Promise<Faculty> {
    const id = randomUUID();
    const facultyMember: Faculty = { ...insertFaculty, id };
    this.faculty.set(id, facultyMember);
    return facultyMember;
  }

  async updateFaculty(id: string, facultyUpdate: Partial<InsertFaculty>): Promise<Faculty | undefined> {
    const facultyMember = this.faculty.get(id);
    if (!facultyMember) return undefined;
    const updatedFaculty = { ...facultyMember, ...facultyUpdate };
    this.faculty.set(id, updatedFaculty);
    return updatedFaculty;
  }

  async deleteFaculty(id: string): Promise<boolean> {
    return this.faculty.delete(id);
  }

  // Room methods
  async getRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(r => r.isActive);
  }

  async getRoom(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = randomUUID();
    const room: Room = { ...insertRoom, id };
    this.rooms.set(id, room);
    return room;
  }

  async updateRoom(id: string, roomUpdate: Partial<InsertRoom>): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    const updatedRoom = { ...room, ...roomUpdate };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async deleteRoom(id: string): Promise<boolean> {
    return this.rooms.delete(id);
  }

  // Time slot methods
  async getTimeSlots(): Promise<TimeSlot[]> {
    return Array.from(this.timeSlots.values()).filter(ts => ts.isActive);
  }

  async createTimeSlot(insertTimeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const id = randomUUID();
    const timeSlot: TimeSlot = { ...insertTimeSlot, id };
    this.timeSlots.set(id, timeSlot);
    return timeSlot;
  }

  // Student methods
  async getStudents(): Promise<Student[]> {
    return Array.from(this.students.values()).filter(s => s.isActive);
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByUser(userId: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(s => s.userId === userId);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student: Student = { ...insertStudent, id };
    this.students.set(id, student);
    return student;
  }

  // Enrollment methods
  async getEnrollments(): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values());
  }

  async getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(e => e.studentId === studentId);
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const id = randomUUID();
    const enrollment: Enrollment = { ...insertEnrollment, id, enrollmentDate: new Date() };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }

  // Faculty assignment methods
  async getFacultyAssignments(): Promise<FacultyAssignment[]> {
    return Array.from(this.facultyAssignments.values());
  }

  async getFacultyAssignmentsByFaculty(facultyId: string): Promise<FacultyAssignment[]> {
    return Array.from(this.facultyAssignments.values()).filter(fa => fa.facultyId === facultyId);
  }

  async createFacultyAssignment(insertAssignment: InsertFacultyAssignment): Promise<FacultyAssignment> {
    const id = randomUUID();
    const assignment: FacultyAssignment = { ...insertAssignment, id };
    this.facultyAssignments.set(id, assignment);
    return assignment;
  }

  // Timetable methods
  async getTimetables(): Promise<Timetable[]> {
    return Array.from(this.timetables.values());
  }

  async getTimetable(id: string): Promise<Timetable | undefined> {
    return this.timetables.get(id);
  }

  async createTimetable(insertTimetable: InsertTimetable): Promise<Timetable> {
    const id = randomUUID();
    const timetable: Timetable = { ...insertTimetable, id, generatedAt: new Date() };
    this.timetables.set(id, timetable);
    return timetable;
  }

  async updateTimetable(id: string, timetableUpdate: Partial<InsertTimetable>): Promise<Timetable | undefined> {
    const timetable = this.timetables.get(id);
    if (!timetable) return undefined;
    const updatedTimetable = { ...timetable, ...timetableUpdate };
    this.timetables.set(id, updatedTimetable);
    return updatedTimetable;
  }

  // Timetable entry methods
  async getTimetableEntries(timetableId: string): Promise<TimetableEntry[]> {
    return Array.from(this.timetableEntries.values()).filter(te => te.timetableId === timetableId);
  }

  async createTimetableEntry(insertEntry: InsertTimetableEntry): Promise<TimetableEntry> {
    const id = randomUUID();
    const entry: TimetableEntry = { ...insertEntry, id };
    this.timetableEntries.set(id, entry);
    return entry;
  }

  // Conflict methods
  async getConflicts(timetableId?: string): Promise<Conflict[]> {
    const allConflicts = Array.from(this.conflicts.values());
    return timetableId ? allConflicts.filter(c => c.timetableId === timetableId) : allConflicts;
  }

  async createConflict(insertConflict: InsertConflict): Promise<Conflict> {
    const id = randomUUID();
    const conflict: Conflict = { ...insertConflict, id, createdAt: new Date() };
    this.conflicts.set(id, conflict);
    return conflict;
  }

  async updateConflict(id: string, conflictUpdate: Partial<InsertConflict>): Promise<Conflict | undefined> {
    const conflict = this.conflicts.get(id);
    if (!conflict) return undefined;
    const updatedConflict = { ...conflict, ...conflictUpdate };
    this.conflicts.set(id, updatedConflict);
    return updatedConflict;
  }
}

export const storage = new MemStorage();
