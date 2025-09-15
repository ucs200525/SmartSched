import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication and role management
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // 'admin', 'faculty', 'student'
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Programs (B.Ed, M.Ed, FYUP, ITEP)
export const programs = pgTable("programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  duration: integer("duration").notNull(), // in semesters
  isActive: boolean("is_active").default(true),
});

// Courses with NEP 2020 classifications
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  credits: integer("credits").notNull(),
  type: text("type").notNull(), // 'theory', 'lab', 'practical'
  category: text("category").notNull(), // 'major', 'minor', 'skill_based', 'ability_enhancement', 'value_added'
  programId: varchar("program_id").references(() => programs.id),
  semester: integer("semester").notNull(),
  description: text("description"),
  prerequisites: text("prerequisites").array(),
  maxStudents: integer("max_students").default(50),
  isActive: boolean("is_active").default(true),
});

// Faculty members
export const faculty = pgTable("faculty", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  employeeId: text("employee_id").notNull().unique(),
  department: text("department").notNull(),
  designation: text("designation").notNull(),
  specialization: text("specialization").array(),
  maxWeeklyHours: integer("max_weekly_hours").default(15),
  availableDays: text("available_days").array(), // ['monday', 'tuesday', etc.]
  unavailableSlots: jsonb("unavailable_slots"), // JSON array of time slots
  isActive: boolean("is_active").default(true),
});

// Rooms and labs
export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // 'classroom', 'lab', 'hall', 'auditorium'
  capacity: integer("capacity").notNull(),
  building: text("building").notNull(),
  floor: integer("floor"),
  equipment: text("equipment").array(),
  isActive: boolean("is_active").default(true),
});

// Time slots configuration
export const timeSlots = pgTable("time_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(),
  day: text("day").notNull(), // 'monday', 'tuesday', etc.
  slotNumber: integer("slot_number").notNull(),
  isActive: boolean("is_active").default(true),
});

// Student enrollments
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  rollNumber: text("roll_number").notNull().unique(),
  programId: varchar("program_id").references(() => programs.id),
  semester: integer("semester").notNull(),
  isActive: boolean("is_active").default(true),
});

// Course enrollments
export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id),
  courseId: varchar("course_id").references(() => courses.id),
  semester: integer("semester").notNull(),
  academicYear: text("academic_year").notNull(),
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
});

// Faculty course assignments
export const facultyAssignments = pgTable("faculty_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facultyId: varchar("faculty_id").references(() => faculty.id),
  courseId: varchar("course_id").references(() => courses.id),
  semester: integer("semester").notNull(),
  academicYear: text("academic_year").notNull(),
  section: text("section"),
});

// Generated timetables
export const timetables = pgTable("timetables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  semester: integer("semester").notNull(),
  academicYear: text("academic_year").notNull(),
  programId: varchar("program_id").references(() => programs.id),
  status: text("status").notNull(), // 'draft', 'published', 'archived'
  generatedAt: timestamp("generated_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
});

// Timetable entries
export const timetableEntries = pgTable("timetable_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timetableId: varchar("timetable_id").references(() => timetables.id),
  courseId: varchar("course_id").references(() => courses.id),
  facultyId: varchar("faculty_id").references(() => faculty.id),
  roomId: varchar("room_id").references(() => rooms.id),
  timeSlotId: varchar("time_slot_id").references(() => timeSlots.id),
  section: text("section"),
  studentCount: integer("student_count"),
});

// Conflicts and resolutions
export const conflicts = pgTable("conflicts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timetableId: varchar("timetable_id").references(() => timetables.id),
  type: text("type").notNull(), // 'room_double_booking', 'faculty_overload', 'capacity_exceeded'
  severity: text("severity").notNull(), // 'high', 'medium', 'low'
  description: text("description").notNull(),
  affectedEntries: text("affected_entries").array(),
  status: text("status").notNull(), // 'open', 'resolved', 'ignored'
  resolutionSuggestions: jsonb("resolution_suggestions"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProgramSchema = createInsertSchema(programs).omit({
  id: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
});

export const insertFacultySchema = createInsertSchema(faculty).omit({
  id: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
});

export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
  id: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrollmentDate: true,
});

export const insertFacultyAssignmentSchema = createInsertSchema(facultyAssignments).omit({
  id: true,
});

export const insertTimetableSchema = createInsertSchema(timetables).omit({
  id: true,
  generatedAt: true,
  approvedAt: true,
});

export const insertTimetableEntrySchema = createInsertSchema(timetableEntries).omit({
  id: true,
});

export const insertConflictSchema = createInsertSchema(conflicts).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Program = typeof programs.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Faculty = typeof faculty.$inferSelect;
export type InsertFaculty = z.infer<typeof insertFacultySchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type TimeSlot = typeof timeSlots.$inferSelect;
export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type FacultyAssignment = typeof facultyAssignments.$inferSelect;
export type InsertFacultyAssignment = z.infer<typeof insertFacultyAssignmentSchema>;
export type Timetable = typeof timetables.$inferSelect;
export type InsertTimetable = z.infer<typeof insertTimetableSchema>;
export type TimetableEntry = typeof timetableEntries.$inferSelect;
export type InsertTimetableEntry = z.infer<typeof insertTimetableEntrySchema>;
export type Conflict = typeof conflicts.$inferSelect;
export type InsertConflict = z.infer<typeof insertConflictSchema>;
