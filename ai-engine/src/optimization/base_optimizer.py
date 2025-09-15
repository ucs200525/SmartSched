"""
Base optimization interface for timetable generation
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any
from ..models import OptimizationRequest, OptimizationResult

class BaseOptimizer(ABC):
    """Abstract base class for timetable optimizers"""
    
    def __init__(self, name: str):
        self.name = name
        self.execution_time = 0.0
    
    @abstractmethod
    def optimize(self, request: OptimizationRequest) -> OptimizationResult:
        """
        Main optimization method
        
        Args:
            request: OptimizationRequest containing all input data
            
        Returns:
            OptimizationResult with generated timetable and metrics
        """
        pass
    
    @abstractmethod
    def validate_constraints(self, request: OptimizationRequest) -> List[str]:
        """
        Validate input constraints and return list of violations
        
        Args:
            request: OptimizationRequest to validate
            
        Returns:
            List of constraint violation messages
        """
        pass
    
    def calculate_optimization_score(self, result: OptimizationResult) -> float:
        """
        Calculate overall optimization score based on multiple factors
        
        Args:
            result: OptimizationResult to score
            
        Returns:
            Optimization score (0-100, higher is better)
        """
        base_score = 100.0
        
        # Deduct for conflicts
        conflict_penalty = len(result.conflicts) * 5
        base_score -= conflict_penalty
        
        # Bonus for balanced workload
        if result.workload_distribution:
            workloads = list(result.workload_distribution.values())
            if workloads:
                workload_variance = sum((w - sum(workloads)/len(workloads))**2 for w in workloads) / len(workloads)
                balance_bonus = max(0, 20 - workload_variance)
                base_score += balance_bonus
        
        return max(0, min(100, base_score))
    
    def detect_conflicts(self, timetable_slots: List[Any]) -> List[Dict[str, Any]]:
        """
        Detect conflicts in the generated timetable
        
        Args:
            timetable_slots: List of timetable slots to check
            
        Returns:
            List of detected conflicts
        """
        conflicts = []
        
        # Group slots by day and time for conflict detection
        time_slots = {}
        for slot in timetable_slots:
            time_key = f"{slot.day}_{slot.time_start}"
            if time_key not in time_slots:
                time_slots[time_key] = []
            time_slots[time_key].append(slot)
        
        # Check for faculty conflicts
        for time_key, slots in time_slots.items():
            faculty_slots = {}
            for slot in slots:
                if slot.faculty_id in faculty_slots:
                    conflicts.append({
                        "type": "faculty_conflict",
                        "description": f"Faculty {slot.faculty_id} assigned to multiple classes at {time_key}",
                        "affected_slots": [faculty_slots[slot.faculty_id].course_id, slot.course_id],
                        "severity": "critical"
                    })
                faculty_slots[slot.faculty_id] = slot
            
            # Check for room conflicts
            room_slots = {}
            for slot in slots:
                if slot.room_id in room_slots:
                    conflicts.append({
                        "type": "room_conflict", 
                        "description": f"Room {slot.room_id} assigned to multiple classes at {time_key}",
                        "affected_slots": [room_slots[slot.room_id].course_id, slot.course_id],
                        "severity": "critical"
                    })
                room_slots[slot.room_id] = slot
        
        return conflicts