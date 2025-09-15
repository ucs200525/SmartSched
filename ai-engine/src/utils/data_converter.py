"""
Utility functions for converting data between the main application and AI engine
"""
from typing import List, Dict, Any
from ..models import (
    OptimizationRequest, TimetableConfig, CourseData, FacultyData, 
    RoomData, StudentData, CourseType, SessionType, OptimizationObjective
)

def convert_from_main_app_format(data: Dict[str, Any]) -> OptimizationRequest:
    """
    Convert data from main application format to AI engine format
    
    Args:
        data: Dictionary with timetable data from main app
        
    Returns:
        OptimizationRequest object for AI engine
    """
    
    # Convert timetable configuration
    config_data = data.get('config', {})
    config = TimetableConfig(
        slot_duration_minutes=config_data.get('slot_duration_minutes', 50),
        college_start_time=config_data.get('college_start_time', '08:30'),
        college_end_time=config_data.get('college_end_time', '17:30'),
        slots_per_day=config_data.get('slots_per_day', 8),
        break_slots=config_data.get('break_slots', []),
        lunch_duration_minutes=config_data.get('lunch_duration_minutes', 60)
    )
    
    # Convert courses
    courses = []
    for course_data in data.get('courses', []):
        course = CourseData(
            id=course_data['id'],
            code=course_data.get('code', ''),
            name=course_data.get('name', ''),
            credits=course_data.get('credits', 3),
            course_type=CourseType(course_data.get('course_type', 'major')),
            session_type=SessionType(course_data.get('session_type', 'theory')),
            student_strength=course_data.get('student_strength', 30),
            requires_lab=course_data.get('requires_lab', False),
            consecutive_slots_required=course_data.get('consecutive_slots_required', 1),
            preferred_time_slots=course_data.get('preferred_time_slots', [])
        )
        courses.append(course)
    
    # Convert faculty
    faculty = []
    for faculty_data in data.get('faculty', []):
        faculty_member = FacultyData(
            id=faculty_data['id'],
            name=faculty_data.get('name', ''),
            email=faculty_data.get('email', ''),
            specializations=faculty_data.get('specializations', []),
            max_workload_hours=faculty_data.get('max_workload_hours', 12),
            availability_slots=faculty_data.get('availability_slots', []),
            preferred_courses=faculty_data.get('preferred_courses', [])
        )
        faculty.append(faculty_member)
    
    # Convert rooms
    rooms = []
    for room_data in data.get('rooms', []):
        room = RoomData(
            id=room_data['id'],
            name=room_data.get('name', ''),
            capacity=room_data.get('capacity', 30),
            room_type=room_data.get('room_type', 'classroom'),
            location_block=room_data.get('location_block', ''),
            equipment=room_data.get('equipment', []),
            course_restrictions=room_data.get('course_restrictions', [])
        )
        rooms.append(room)
    
    # Convert students
    students = []
    for student_data in data.get('students', []):
        student = StudentData(
            id=student_data['id'],
            program_id=student_data.get('program_id', ''),
            semester=student_data.get('semester', 1),
            enrolled_courses=student_data.get('enrolled_courses', []),
            total_credits=student_data.get('total_credits', 20)
        )
        students.append(student)
    
    # Convert objectives
    objectives = []
    for obj in data.get('objectives', ['minimize_conflicts']):
        if isinstance(obj, str):
            objectives.append(OptimizationObjective(obj))
        else:
            objectives.append(obj)
    
    return OptimizationRequest(
        config=config,
        courses=courses,
        faculty=faculty,
        rooms=rooms,
        students=students,
        objectives=objectives,
        constraints=data.get('constraints', {})
    )

def convert_to_main_app_format(result: Any) -> Dict[str, Any]:
    """
    Convert AI engine result to main application format
    
    Args:
        result: OptimizationResult from AI engine
        
    Returns:
        Dictionary in main application format
    """
    from ..models import OptimizationResult
    
    if not isinstance(result, OptimizationResult):
        return {"error": "Invalid result type"}
    
    # Convert timetable slots
    timetable_entries = []
    for slot in result.timetable_slots:
        entry = {
            "day": slot.day,
            "time_start": slot.time_start,
            "time_end": slot.time_end,
            "course_id": slot.course_id,
            "faculty_id": slot.faculty_id,
            "room_id": slot.room_id,
            "student_groups": slot.student_groups
        }
        timetable_entries.append(entry)
    
    # Convert conflicts
    conflicts = []
    for conflict in result.conflicts:
        conflict_entry = {
            "type": conflict.get("type", "unknown"),
            "description": conflict.get("description", ""),
            "affected_entities": conflict.get("affected_slots", []),
            "severity": conflict.get("severity", "medium")
        }
        conflicts.append(conflict_entry)
    
    return {
        "success": result.success,
        "message": result.message,
        "timetable_entries": timetable_entries,
        "conflicts": conflicts,
        "optimization_score": result.optimization_score,
        "execution_time_seconds": result.execution_time_seconds,
        "algorithm_used": result.algorithm_used,
        "workload_distribution": result.workload_distribution
    }

def extract_from_storage(storage_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract and format data from main application storage for AI optimization
    
    Args:
        storage_data: Raw data from main application storage
        
    Returns:
        Formatted data ready for AI optimization
    """
    
    # Extract courses with student enrollment data
    courses = []
    course_enrollments = {}
    
    # Count enrollments per course
    for enrollment in storage_data.get('enrollments', []):
        course_id = enrollment.get('courseId')
        if course_id:
            if course_id not in course_enrollments:
                course_enrollments[course_id] = []
            course_enrollments[course_id].append(enrollment.get('studentId'))
    
    # Format courses with enrollment data
    for course in storage_data.get('courses', []):
        course_id = course['id']
        enrolled_students = course_enrollments.get(course_id, [])
        
        formatted_course = {
            "id": course_id,
            "code": course.get('code', ''),
            "name": course.get('name', ''),
            "credits": course.get('credits', 3),
            "course_type": course.get('type', 'major'),
            "session_type": "lab" if course.get('type') == 'lab' else "theory",
            "student_strength": len(enrolled_students),
            "requires_lab": course.get('type') == 'lab',
            "consecutive_slots_required": 2 if course.get('type') == 'lab' else 1
        }
        courses.append(formatted_course)
    
    # Format faculty with assignments
    faculty = []
    for faculty_member in storage_data.get('faculty', []):
        # Get faculty assignments
        assignments = [
            assignment for assignment in storage_data.get('facultyAssignments', [])
            if assignment.get('facultyId') == faculty_member['id']
        ]
        
        specializations = faculty_member.get('specialization', '').split(',')
        specializations = [spec.strip() for spec in specializations if spec.strip()]
        
        formatted_faculty = {
            "id": faculty_member['id'],
            "name": f"{faculty_member.get('firstName', '')} {faculty_member.get('lastName', '')}".strip(),
            "email": faculty_member.get('email', ''),
            "specializations": specializations,
            "max_workload_hours": faculty_member.get('maxWorkloadHours', 12),
            "preferred_courses": [assignment.get('courseId') for assignment in assignments]
        }
        faculty.append(formatted_faculty)
    
    # Format rooms
    rooms = []
    for room in storage_data.get('rooms', []):
        formatted_room = {
            "id": room['id'],
            "name": room.get('name', ''),
            "capacity": room.get('capacity', 30),
            "room_type": room.get('type', 'classroom'),
            "location_block": room.get('building', ''),
            "equipment": room.get('equipment', '').split(',') if room.get('equipment') else []
        }
        rooms.append(formatted_room)
    
    # Format students
    students = []
    for student in storage_data.get('students', []):
        # Get student enrollments
        student_enrollments = [
            enrollment.get('courseId') for enrollment in storage_data.get('enrollments', [])
            if enrollment.get('studentId') == student['id']
        ]
        
        # Calculate total credits
        total_credits = 0
        for course_id in student_enrollments:
            course = next((c for c in storage_data.get('courses', []) if c['id'] == course_id), None)
            if course:
                total_credits += course.get('credits', 3)
        
        formatted_student = {
            "id": student['id'],
            "program_id": student.get('programId', ''),
            "semester": student.get('semester', 1),
            "enrolled_courses": student_enrollments,
            "total_credits": total_credits
        }
        students.append(formatted_student)
    
    # Default configuration
    config = {
        "slot_duration_minutes": 50,
        "college_start_time": "08:30",
        "college_end_time": "17:30",
        "slots_per_day": 8,
        "lunch_duration_minutes": 60
    }
    
    return {
        "config": config,
        "courses": courses,
        "faculty": faculty,
        "rooms": rooms,
        "students": students,
        "objectives": ["minimize_conflicts", "balance_workload"],
        "constraints": {}
    }