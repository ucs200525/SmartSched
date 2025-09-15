"""
Integer Linear Programming (ILP) based timetable optimizer using PuLP
"""
import time
from typing import List, Dict, Any
import pulp
from .base_optimizer import BaseOptimizer
from ..models import OptimizationRequest, OptimizationResult, TimetableSlot

class ILPOptimizer(BaseOptimizer):
    """ILP-based timetable optimizer using PuLP"""
    
    def __init__(self):
        super().__init__("ILP-PuLP")
        self.problem = None
        self.variables = {}
    
    def optimize(self, request: OptimizationRequest) -> OptimizationResult:
        """
        Optimize timetable using Integer Linear Programming approach
        """
        start_time = time.time()
        
        # Validate constraints
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
            # Create ILP problem
            self._create_problem(request)
            
            # Add variables
            self._add_variables(request)
            
            # Add constraints
            self._add_constraints(request)
            
            # Set objective
            self._set_objective(request)
            
            # Solve problem
            self.problem.solve(pulp.PULP_CBC_CMD(msg=0))
            
            if self.problem.status == pulp.LpStatusOptimal:
                # Extract solution
                timetable_slots = self._extract_solution(request)
                conflicts = self.detect_conflicts(timetable_slots)
                workload_dist = self._calculate_workload_distribution(request, timetable_slots)
                
                result = OptimizationResult(
                    success=True,
                    message="Optimal solution found",
                    timetable_slots=timetable_slots,
                    conflicts=conflicts,
                    execution_time_seconds=time.time() - start_time,
                    algorithm_used=self.name,
                    optimization_score=0.0,
                    workload_distribution=workload_dist
                )
                
                result.optimization_score = self.calculate_optimization_score(result)
                return result
                
            elif self.problem.status == pulp.LpStatusInfeasible:
                return OptimizationResult(
                    success=False,
                    message="Problem is infeasible - no solution exists with given constraints",
                    timetable_slots=[],
                    execution_time_seconds=time.time() - start_time,
                    algorithm_used=self.name,
                    optimization_score=0.0
                )
            
            else:
                return OptimizationResult(
                    success=False,
                    message=f"Optimization failed with status: {pulp.LpStatus[self.problem.status]}",
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
        
        # Check resource availability
        if not request.courses:
            violations.append("No courses provided")
        if not request.faculty:
            violations.append("No faculty provided")
        if not request.rooms:
            violations.append("No rooms provided")
        
        # Check faculty capacity
        total_course_credits = sum(course.credits for course in request.courses)
        total_faculty_capacity = sum(faculty.max_workload_hours for faculty in request.faculty)
        
        if total_course_credits > total_faculty_capacity:
            violations.append(f"Insufficient faculty capacity: need {total_course_credits} hours, have {total_faculty_capacity}")
        
        # Check room capacity for each course
        for course in request.courses:
            suitable_rooms = [r for r in request.rooms if r.capacity >= course.student_strength]
            if not suitable_rooms:
                violations.append(f"No room with sufficient capacity for course {course.code} (needs {course.student_strength} seats)")
        
        return violations
    
    def _create_problem(self, request: OptimizationRequest):
        """Create the ILP problem"""
        self.problem = pulp.LpProblem("Timetable_Optimization", pulp.LpMinimize)
    
    def _add_variables(self, request: OptimizationRequest):
        """Add decision variables to the problem"""
        self.variables = {}
        
        # Time slots
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        time_slots = list(range(request.config.slots_per_day))
        
        # Binary variable: x[c,d,t,f,r] = 1 if course c is scheduled on day d, time t, with faculty f, in room r
        self.variables['schedule'] = {}
        for course in request.courses:
            for day in days:
                for slot in time_slots:
                    for faculty in request.faculty:
                        for room in request.rooms:
                            var_name = f"x_{course.id}_{day}_{slot}_{faculty.id}_{room.id}"
                            self.variables['schedule'][(course.id, day, slot, faculty.id, room.id)] = \
                                pulp.LpVariable(var_name, cat='Binary')
        
        # Conflict variables for soft constraints
        self.variables['conflicts'] = {}
        
        # Faculty overload variables
        for faculty in request.faculty:
            var_name = f"overload_{faculty.id}"
            self.variables['conflicts'][f"faculty_overload_{faculty.id}"] = \
                pulp.LpVariable(var_name, lowBound=0, cat='Continuous')
        
        # Room capacity violation variables
        for course in request.courses:
            for room in request.rooms:
                if room.capacity < course.student_strength:
                    var_name = f"capacity_violation_{course.id}_{room.id}"
                    self.variables['conflicts'][f"capacity_{course.id}_{room.id}"] = \
                        pulp.LpVariable(var_name, cat='Binary')
    
    def _add_constraints(self, request: OptimizationRequest):
        """Add constraints to the problem"""
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        time_slots = list(range(request.config.slots_per_day))
        
        # Constraint 1: Each course must be scheduled for exactly its credit hours
        for course in request.courses:
            schedule_sum = []
            for day in days:
                for slot in time_slots:
                    for faculty in request.faculty:
                        for room in request.rooms:
                            if (course.id, day, slot, faculty.id, room.id) in self.variables['schedule']:
                                schedule_sum.append(self.variables['schedule'][(course.id, day, slot, faculty.id, room.id)])
            
            if schedule_sum:
                self.problem += pulp.lpSum(schedule_sum) == course.credits, f"Course_Hours_{course.id}"
        
        # Constraint 2: No faculty conflicts (one faculty per time slot)
        for faculty in request.faculty:
            for day in days:
                for slot in time_slots:
                    faculty_assignments = []
                    for course in request.courses:
                        for room in request.rooms:
                            if (course.id, day, slot, faculty.id, room.id) in self.variables['schedule']:
                                faculty_assignments.append(self.variables['schedule'][(course.id, day, slot, faculty.id, room.id)])
                    
                    if faculty_assignments:
                        self.problem += pulp.lpSum(faculty_assignments) <= 1, f"Faculty_Conflict_{faculty.id}_{day}_{slot}"
        
        # Constraint 3: No room conflicts (one course per room per time slot)
        for room in request.rooms:
            for day in days:
                for slot in time_slots:
                    room_assignments = []
                    for course in request.courses:
                        for faculty in request.faculty:
                            if (course.id, day, slot, faculty.id, room.id) in self.variables['schedule']:
                                room_assignments.append(self.variables['schedule'][(course.id, day, slot, faculty.id, room.id)])
                    
                    if room_assignments:
                        self.problem += pulp.lpSum(room_assignments) <= 1, f"Room_Conflict_{room.id}_{day}_{slot}"
        
        # Constraint 4: Faculty workload limits (soft constraint with penalty)
        for faculty in request.faculty:
            faculty_workload = []
            for course in request.courses:
                for day in days:
                    for slot in time_slots:
                        for room in request.rooms:
                            if (course.id, day, slot, faculty.id, room.id) in self.variables['schedule']:
                                faculty_workload.append(self.variables['schedule'][(course.id, day, slot, faculty.id, room.id)])
            
            if faculty_workload and f"faculty_overload_{faculty.id}" in self.variables['conflicts']:
                self.problem += (pulp.lpSum(faculty_workload) - faculty.max_workload_hours <= 
                               self.variables['conflicts'][f"faculty_overload_{faculty.id}"]), \
                               f"Faculty_Workload_{faculty.id}"
        
        # Constraint 5: Room capacity (soft constraint with penalty)
        for course in request.courses:
            for room in request.rooms:
                if room.capacity < course.student_strength:
                    for day in days:
                        for slot in time_slots:
                            for faculty in request.faculty:
                                if (course.id, day, slot, faculty.id, room.id) in self.variables['schedule'] and \
                                   f"capacity_{course.id}_{room.id}" in self.variables['conflicts']:
                                    self.problem += (self.variables['schedule'][(course.id, day, slot, faculty.id, room.id)] <= 
                                                   self.variables['conflicts'][f"capacity_{course.id}_{room.id}"]), \
                                                   f"Capacity_Violation_{course.id}_{room.id}_{day}_{slot}_{faculty.id}"
        
        # Constraint 6: Faculty specialization preferences (soft)
        for course in request.courses:
            qualified_faculty = [f for f in request.faculty if any(spec.lower() in course.name.lower() for spec in f.specializations)]
            if qualified_faculty:
                # Encourage assignment to qualified faculty
                qualified_assignments = []
                unqualified_assignments = []
                
                for day in days:
                    for slot in time_slots:
                        for room in request.rooms:
                            for faculty in request.faculty:
                                if (course.id, day, slot, faculty.id, room.id) in self.variables['schedule']:
                                    if faculty in qualified_faculty:
                                        qualified_assignments.append(self.variables['schedule'][(course.id, day, slot, faculty.id, room.id)])
                                    else:
                                        unqualified_assignments.append(self.variables['schedule'][(course.id, day, slot, faculty.id, room.id)])
                
                # Prefer qualified faculty (soft constraint)
                if qualified_assignments and unqualified_assignments:
                    qualification_penalty = f"qualification_penalty_{course.id}"
                    self.variables['conflicts'][qualification_penalty] = pulp.LpVariable(qualification_penalty, cat='Binary')
                    
                    # If any unqualified faculty is assigned, activate penalty
                    if unqualified_assignments:
                        self.problem += (pulp.lpSum(unqualified_assignments) <= 
                                       len(unqualified_assignments) * self.variables['conflicts'][qualification_penalty]), \
                                       f"Qualification_Penalty_{course.id}"
    
    def _set_objective(self, request: OptimizationRequest):
        """Set the optimization objective"""
        objective_terms = []
        
        # Minimize conflicts and violations
        for var_name, var in self.variables['conflicts'].items():
            if 'overload' in var_name:
                objective_terms.append(10 * var)  # High penalty for faculty overload
            elif 'capacity' in var_name:
                objective_terms.append(20 * var)  # Very high penalty for capacity violations
            elif 'qualification' in var_name:
                objective_terms.append(5 * var)   # Medium penalty for qualification mismatch
        
        # Add workload balance objective
        if len(request.faculty) > 1:
            # Add workload variance minimization (simplified)
            for i, faculty1 in enumerate(request.faculty):
                for faculty2 in request.faculty[i+1:]:
                    # Add variables for workload difference
                    diff_var = pulp.LpVariable(f"workload_diff_{faculty1.id}_{faculty2.id}", lowBound=0)
                    self.variables['conflicts'][f"workload_diff_{faculty1.id}_{faculty2.id}"] = diff_var
                    
                    # Calculate workload for each faculty
                    workload1 = []
                    workload2 = []
                    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                    time_slots = list(range(request.config.slots_per_day))
                    
                    for course in request.courses:
                        for day in days:
                            for slot in time_slots:
                                for room in request.rooms:
                                    if (course.id, day, slot, faculty1.id, room.id) in self.variables['schedule']:
                                        workload1.append(self.variables['schedule'][(course.id, day, slot, faculty1.id, room.id)])
                                    if (course.id, day, slot, faculty2.id, room.id) in self.variables['schedule']:
                                        workload2.append(self.variables['schedule'][(course.id, day, slot, faculty2.id, room.id)])
                    
                    # Add constraints for absolute difference
                    if workload1 and workload2:
                        self.problem += (pulp.lpSum(workload1) - pulp.lpSum(workload2) <= diff_var), \
                                       f"Workload_Diff_Pos_{faculty1.id}_{faculty2.id}"
                        self.problem += (pulp.lpSum(workload2) - pulp.lpSum(workload1) <= diff_var), \
                                       f"Workload_Diff_Neg_{faculty1.id}_{faculty2.id}"
                    
                    # Add to objective with lower weight
                    objective_terms.append(2 * diff_var)
        
        # Set the objective
        if objective_terms:
            self.problem += pulp.lpSum(objective_terms), "Minimize_Conflicts_and_Balance_Workload"
        else:
            # Fallback objective - minimize total assignments (should not happen with proper constraints)
            all_assignments = []
            for var in self.variables['schedule'].values():
                all_assignments.append(var)
            if all_assignments:
                self.problem += pulp.lpSum(all_assignments), "Minimize_Total_Assignments"
    
    def _extract_solution(self, request: OptimizationRequest) -> List[TimetableSlot]:
        """Extract timetable solution from solved problem"""
        timetable_slots = []
        
        # Generate time mapping
        time_mapping = self._generate_time_mapping(request.config)
        
        for (course_id, day, slot, faculty_id, room_id), var in self.variables['schedule'].items():
            if var.varValue and var.varValue > 0.5:  # Binary variable is 1
                time_info = time_mapping[slot]
                timetable_slots.append(TimetableSlot(
                    day=day,
                    time_start=time_info['start'],
                    time_end=time_info['end'],
                    course_id=course_id,
                    faculty_id=faculty_id,
                    room_id=room_id,
                    student_groups=[course_id]  # Simplified
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