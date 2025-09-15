"""
Data models for the AI/Optimization Engine
"""
from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from enum import Enum

class CourseType(str, Enum):
    MAJOR = "major"
    MINOR = "minor" 
    SKILL_BASED = "skill_based"
    ABILITY_ENHANCEMENT = "ability_enhancement"
    VALUE_ADDED = "value_added"

class SessionType(str, Enum):
    THEORY = "theory"
    LAB = "lab"
    INTERNSHIP = "internship"
    PROJECT = "project"

class OptimizationObjective(str, Enum):
    MINIMIZE_CONFLICTS = "minimize_conflicts"
    BALANCE_WORKLOAD = "balance_workload"
    MAXIMIZE_ROOM_UTILIZATION = "maximize_room_utilization"
    MINIMIZE_GAPS = "minimize_gaps"

class TimetableConfig(BaseModel):
    """Base timetable configuration"""
    slot_duration_minutes: int = 50
    college_start_time: str = "08:30"
    college_end_time: str = "17:30" 
    slots_per_day: int = 8
    break_slots: List[Dict[str, str]] = []
    lunch_duration_minutes: int = 60

class CourseData(BaseModel):
    """Course information for optimization"""
    id: str
    code: str
    name: str
    credits: int
    course_type: CourseType
    session_type: SessionType
    student_strength: int
    requires_lab: bool = False
    consecutive_slots_required: int = 1
    preferred_time_slots: List[str] = []

class FacultyData(BaseModel):
    """Faculty information for optimization"""
    id: str
    name: str
    email: str
    specializations: List[str]
    max_workload_hours: int = 12
    availability_slots: List[str] = []
    preferred_courses: List[str] = []

class RoomData(BaseModel):
    """Room/Lab information for optimization"""
    id: str
    name: str
    capacity: int
    room_type: str  # "classroom", "lab", "auditorium"
    location_block: str
    equipment: List[str] = []
    course_restrictions: List[str] = []

class StudentData(BaseModel):
    """Student enrollment data"""
    id: str
    program_id: str
    semester: int
    enrolled_courses: List[str]
    total_credits: int

class OptimizationRequest(BaseModel):
    """Request for timetable optimization"""
    config: TimetableConfig
    courses: List[CourseData]
    faculty: List[FacultyData]
    rooms: List[RoomData]
    students: List[StudentData]
    objectives: List[OptimizationObjective]
    constraints: Dict[str, Any] = {}

class TimetableSlot(BaseModel):
    """Individual timetable slot"""
    day: str
    time_start: str
    time_end: str
    course_id: str
    faculty_id: str
    room_id: str
    student_groups: List[str]

class OptimizationResult(BaseModel):
    """Result of timetable optimization"""
    success: bool
    message: str
    timetable_slots: List[TimetableSlot]
    conflicts: List[Dict[str, Any]] = []
    optimization_score: float
    execution_time_seconds: float
    algorithm_used: str
    workload_distribution: Dict[str, int] = {}

class ConflictData(BaseModel):
    """Conflict information"""
    conflict_type: str
    description: str
    affected_entities: List[str]
    severity: str  # "low", "medium", "high", "critical"
    suggestions: List[str] = []