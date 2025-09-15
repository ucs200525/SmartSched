"""
Constraint Satisfaction Problem (CSP) based timetable optimizer using OR-Tools
"""
import time
from typing import List, Dict, Any
from ortools.sat.python import cp_model
from .base_optimizer import BaseOptimizer
from ..models import OptimizationRequest, OptimizationResult, TimetableSlot

class CSPOptimizer(BaseOptimizer):
    """CSP-based timetable optimizer using Google OR-Tools CP-SAT solver"""
    
    def __init__(self):
        super().__init__("CSP-OR-Tools")
        self.model = None
        self.solver = None
    
    def optimize(self, request: OptimizationRequest) -> OptimizationResult:
        """
        Optimize timetable using Constraint Satisfaction Problem approach
        """
        start_time = time.time()
        
        # Validate constraints first
        violations = self.validate_constraints(request)
        if violations:
            return OptimizationResult(
                success=False,
                message=f"Constraint violations: {'; '.join(violations)}",
                timetable_slots=[],
                execution_time_seconds=time.time() - start_time,
                algorithm_used=self.name,
                optimization_score=0.0
            )
        
        try:
            # Initialize CP model
            self.model = cp_model.CpModel()
            self.solver = cp_model.CpSolver()
            
            # Create decision variables
            variables = self._create_variables(request)
            
            # Add constraints
            self._add_constraints(request, variables)
            
            # Add objectives
            self._add_objectives(request, variables)
            
            # Solve the model
            status = self.solver.Solve(self.model)
            
            if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
                # Extract solution
                timetable_slots = self._extract_solution(request, variables)
                conflicts = self.detect_conflicts(timetable_slots)
                workload_dist = self._calculate_workload_distribution(request, timetable_slots)
                
                result = OptimizationResult(
                    success=True,
                    message="Optimization completed successfully",
                    timetable_slots=timetable_slots,
                    conflicts=conflicts,
                    execution_time_seconds=time.time() - start_time,
                    algorithm_used=self.name,
                    optimization_score=0.0,
                    workload_distribution=workload_dist
                )
                
                result.optimization_score = self.calculate_optimization_score(result)
                return result
            
            else:
                return OptimizationResult(
                    success=False,
                    message="No feasible solution found",
                    timetable_slots=[],
                    execution_time_seconds=time.time() - start_time,
                    algorithm_used=self.name,
                    optimization_score=0.0
                )
                
        except Exception as e:
            return OptimizationResult(
                success=False,
                message=f"Optimization failed: {str(e)}",
                timetable_slots=[],
                execution_time_seconds=time.time() - start_time,
                algorithm_used=self.name,
                optimization_score=0.0
            )
    
    def validate_constraints(self, request: OptimizationRequest) -> List[str]:
        """Validate input constraints"""
        violations = []
        
        # Check if we have sufficient resources
        total_course_hours = sum(course.credits for course in request.courses)
        total_faculty_hours = sum(faculty.max_workload_hours for faculty in request.faculty)
        
        if total_course_hours > total_faculty_hours:
            violations.append("Insufficient faculty capacity for course load")
        
        # Check room capacity constraints
        for course in request.courses:
            suitable_rooms = [r for r in request.rooms if r.capacity >= course.student_strength]
            if not suitable_rooms:
                violations.append(f"No room with sufficient capacity for course {course.code}")
        
        return violations
    
    def _create_variables(self, request: OptimizationRequest) -> Dict[str, Any]:
        """Create decision variables for the CSP model"""
        variables = {}
        
        # Time slots (simplified - assuming 5 days, 8 slots per day)
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        time_slots = list(range(request.config.slots_per_day))
        
        # Variables: course_slot[course_id, day, slot] = 1 if course is scheduled at this time
        variables['course_slot'] = {}
        for course in request.courses:
            for day in days:
                for slot in time_slots:
                    var_name = f"course_{course.id}_{day}_{slot}"
                    variables['course_slot'][(course.id, day, slot)] = self.model.NewBoolVar(var_name)
        
        # Variables: faculty_assignment[course_id, faculty_id] = 1 if faculty is assigned to course
        variables['faculty_assignment'] = {}
        for course in request.courses:
            for faculty in request.faculty:
                var_name = f"faculty_{course.id}_{faculty.id}"
                variables['faculty_assignment'][(course.id, faculty.id)] = self.model.NewBoolVar(var_name)
        
        # Variables: room_assignment[course_id, room_id] = 1 if room is assigned to course
        variables['room_assignment'] = {}
        for course in request.courses:
            for room in request.rooms:
                var_name = f"room_{course.id}_{room.id}"
                variables['room_assignment'][(course.id, room.id)] = self.model.NewBoolVar(var_name)
        
        return variables
    
    def _add_constraints(self, request: OptimizationRequest, variables: Dict[str, Any]):
        """Add constraints to the CSP model"""
        
        # Each course must be scheduled for exactly its credit hours
        for course in request.courses:
            course_slots = []
            for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']:
                for slot in range(request.config.slots_per_day):
                    if (course.id, day, slot) in variables['course_slot']:
                        course_slots.append(variables['course_slot'][(course.id, day, slot)])
            
            if course_slots:
                self.model.Add(sum(course_slots) == course.credits)
        
        # Each course must have exactly one faculty assigned
        for course in request.courses:
            faculty_assignments = []
            for faculty in request.faculty:
                if (course.id, faculty.id) in variables['faculty_assignment']:
                    faculty_assignments.append(variables['faculty_assignment'][(course.id, faculty.id)])
            
            if faculty_assignments:
                self.model.Add(sum(faculty_assignments) == 1)
        
        # Each course must have exactly one room assigned
        for course in request.courses:
            room_assignments = []
            for room in request.rooms:
                if (course.id, room.id) in variables['room_assignment']:
                    room_assignments.append(variables['room_assignment'][(course.id, room.id)])
            
            if room_assignments:
                self.model.Add(sum(room_assignments) == 1)
        
        # Faculty workload constraints
        for faculty in request.faculty:
            faculty_workload = []
            for course in request.courses:
                if (course.id, faculty.id) in variables['faculty_assignment']:
                    for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']:
                        for slot in range(request.config.slots_per_day):
                            if (course.id, day, slot) in variables['course_slot']:
                                # Link faculty assignment to course scheduling
                                faculty_workload.append(
                                    variables['faculty_assignment'][(course.id, faculty.id)] * 
                                    variables['course_slot'][(course.id, day, slot)]
                                )
            
            if faculty_workload:
                self.model.Add(sum(faculty_workload) <= faculty.max_workload_hours)
        
        # Room capacity constraints
        for room in request.rooms:
            for course in request.courses:
                if (course.id, room.id) in variables['room_assignment']:
                    # Only assign room if capacity is sufficient
                    if room.capacity < course.student_strength:
                        self.model.Add(variables['room_assignment'][(course.id, room.id)] == 0)
    
    def _add_objectives(self, request: OptimizationRequest, variables: Dict[str, Any]):
        """Add optimization objectives"""
        # For now, we'll minimize conflicts (handled by constraints)
        # Future: Add weighted objectives for workload balance, gap minimization, etc.
        pass
    
    def _extract_solution(self, request: OptimizationRequest, variables: Dict[str, Any]) -> List[TimetableSlot]:
        """Extract timetable solution from solved model"""
        timetable_slots = []
        
        # Generate time mappings
        time_mapping = self._generate_time_mapping(request.config)
        
        for course in request.courses:
            # Find assigned faculty
            assigned_faculty = None
            for faculty in request.faculty:
                if (course.id, faculty.id) in variables['faculty_assignment']:
                    if self.solver.Value(variables['faculty_assignment'][(course.id, faculty.id)]):
                        assigned_faculty = faculty.id
                        break
            
            # Find assigned room
            assigned_room = None
            for room in request.rooms:
                if (course.id, room.id) in variables['room_assignment']:
                    if self.solver.Value(variables['room_assignment'][(course.id, room.id)]):
                        assigned_room = room.id
                        break
            
            # Find scheduled time slots
            for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']:
                for slot in range(request.config.slots_per_day):
                    if (course.id, day, slot) in variables['course_slot']:
                        if self.solver.Value(variables['course_slot'][(course.id, day, slot)]):
                            time_info = time_mapping[slot]
                            timetable_slots.append(TimetableSlot(
                                day=day,
                                time_start=time_info['start'],
                                time_end=time_info['end'],
                                course_id=course.id,
                                faculty_id=assigned_faculty or "",
                                room_id=assigned_room or "",
                                student_groups=[course.id]  # Simplified
                            ))
        
        return timetable_slots
    
    def _generate_time_mapping(self, config) -> Dict[int, Dict[str, str]]:
        """Generate mapping from slot numbers to actual times"""
        from datetime import datetime, timedelta
        
        start_time = datetime.strptime(config.college_start_time, "%H:%M")
        slot_duration = timedelta(minutes=config.slot_duration_minutes)
        
        time_mapping = {}
        current_time = start_time
        
        for slot in range(config.slots_per_day):
            time_mapping[slot] = {
                'start': current_time.strftime("%H:%M"),
                'end': (current_time + slot_duration).strftime("%H:%M")
            }
            current_time += slot_duration
        
        return time_mapping
    
    def _calculate_workload_distribution(self, request: OptimizationRequest, timetable_slots: List[TimetableSlot]) -> Dict[str, int]:
        """Calculate workload distribution across faculty"""
        workload = {}
        
        for slot in timetable_slots:
            if slot.faculty_id:
                workload[slot.faculty_id] = workload.get(slot.faculty_id, 0) + 1
        
        return workload