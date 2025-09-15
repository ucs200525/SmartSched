"""
Genetic Algorithm based timetable optimizer for multi-objective optimization
"""
import random
import time
from typing import List, Dict, Any, Tuple
from .base_optimizer import BaseOptimizer
from ..models import OptimizationRequest, OptimizationResult, TimetableSlot

class Individual:
    """Represents an individual solution in the genetic algorithm"""
    
    def __init__(self, timetable_slots: List[TimetableSlot]):
        self.timetable_slots = timetable_slots
        self.fitness = 0.0
        self.conflicts = []
        self.workload_balance = 0.0
        self.room_utilization = 0.0

class GeneticOptimizer(BaseOptimizer):
    """Genetic Algorithm optimizer for multi-objective timetable optimization"""
    
    def __init__(self, population_size: int = 100, generations: int = 1000, 
                 mutation_rate: float = 0.1, crossover_rate: float = 0.8):
        super().__init__("Genetic-Algorithm")
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate
        self.best_individual = None
    
    def optimize(self, request: OptimizationRequest) -> OptimizationResult:
        """
        Optimize timetable using Genetic Algorithm approach
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
            # Initialize population
            population = self._initialize_population(request)
            
            # Evolution process
            for generation in range(self.generations):
                # Evaluate fitness
                self._evaluate_population(population, request)
                
                # Select best individuals
                population = self._selection(population)
                
                # Apply crossover and mutation
                population = self._crossover_and_mutation(population, request)
                
                # Track best solution
                best_individual = max(population, key=lambda x: x.fitness)
                if self.best_individual is None or best_individual.fitness > self.best_individual.fitness:
                    self.best_individual = best_individual
                
                # Early termination if perfect solution found
                if best_individual.fitness >= 100.0:
                    break
            
            # Extract best solution
            if self.best_individual:
                conflicts = self.detect_conflicts(self.best_individual.timetable_slots)
                workload_dist = self._calculate_workload_distribution(request, self.best_individual.timetable_slots)
                
                result = OptimizationResult(
                    success=True,
                    message=f"Optimization completed after {generation + 1} generations",
                    timetable_slots=self.best_individual.timetable_slots,
                    conflicts=conflicts,
                    execution_time_seconds=time.time() - start_time,
                    algorithm_used=self.name,
                    optimization_score=self.best_individual.fitness,
                    workload_distribution=workload_dist
                )
                return result
            else:
                return OptimizationResult(
                    success=False,
                    message="Failed to generate valid solution",
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
        
        # Basic resource validation
        if not request.courses:
            violations.append("No courses provided")
        if not request.faculty:
            violations.append("No faculty provided")
        if not request.rooms:
            violations.append("No rooms provided")
        
        # Check faculty qualifications
        for course in request.courses:
            qualified_faculty = [f for f in request.faculty if any(spec in course.name.lower() for spec in f.specializations)]
            if not qualified_faculty:
                violations.append(f"No qualified faculty for course {course.code}")
        
        return violations
    
    def _initialize_population(self, request: OptimizationRequest) -> List[Individual]:
        """Initialize population with random solutions"""
        population = []
        
        for _ in range(self.population_size):
            individual = self._create_random_individual(request)
            population.append(individual)
        
        return population
    
    def _create_random_individual(self, request: OptimizationRequest) -> Individual:
        """Create a random individual solution"""
        timetable_slots = []
        
        # Available time slots
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        time_slots = list(range(request.config.slots_per_day))
        
        # Generate time mapping
        time_mapping = self._generate_time_mapping(request.config)
        
        for course in request.courses:
            # Randomly assign faculty (prefer qualified ones)
            qualified_faculty = [f for f in request.faculty if any(spec in course.name.lower() for spec in f.specializations)]
            if not qualified_faculty:
                qualified_faculty = request.faculty
            
            assigned_faculty = random.choice(qualified_faculty)
            
            # Randomly assign room (prefer suitable capacity)
            suitable_rooms = [r for r in request.rooms if r.capacity >= course.student_strength]
            if not suitable_rooms:
                suitable_rooms = request.rooms
            
            assigned_room = random.choice(suitable_rooms)
            
            # Randomly assign time slots for required credits
            slots_needed = course.credits
            assigned_slots = []
            
            # Try to assign consecutive slots for labs
            if course.requires_lab and course.consecutive_slots_required > 1:
                # Find consecutive slots
                for day in random.sample(days, len(days)):
                    for start_slot in range(len(time_slots) - course.consecutive_slots_required + 1):
                        consecutive_slots = list(range(start_slot, start_slot + course.consecutive_slots_required))
                        if len(assigned_slots) + len(consecutive_slots) <= slots_needed:
                            for slot in consecutive_slots:
                                time_info = time_mapping[slot]
                                assigned_slots.append(TimetableSlot(
                                    day=day,
                                    time_start=time_info['start'],
                                    time_end=time_info['end'],
                                    course_id=course.id,
                                    faculty_id=assigned_faculty.id,
                                    room_id=assigned_room.id,
                                    student_groups=[course.id]
                                ))
                            break
                    if len(assigned_slots) >= slots_needed:
                        break
            
            # Fill remaining slots randomly
            while len(assigned_slots) < slots_needed:
                day = random.choice(days)
                slot = random.choice(time_slots)
                time_info = time_mapping[slot]
                
                assigned_slots.append(TimetableSlot(
                    day=day,
                    time_start=time_info['start'],
                    time_end=time_info['end'],
                    course_id=course.id,
                    faculty_id=assigned_faculty.id,
                    room_id=assigned_room.id,
                    student_groups=[course.id]
                ))
            
            timetable_slots.extend(assigned_slots[:slots_needed])
        
        return Individual(timetable_slots)
    
    def _evaluate_population(self, population: List[Individual], request: OptimizationRequest):
        """Evaluate fitness for all individuals in population"""
        for individual in population:
            individual.conflicts = self.detect_conflicts(individual.timetable_slots)
            individual.workload_balance = self._calculate_workload_balance(request, individual.timetable_slots)
            individual.room_utilization = self._calculate_room_utilization(request, individual.timetable_slots)
            individual.fitness = self._calculate_fitness(individual, request)
    
    def _calculate_fitness(self, individual: Individual, request: OptimizationRequest) -> float:
        """Calculate multi-objective fitness score"""
        fitness = 100.0
        
        # Conflict penalty (high weight)
        conflict_penalty = len(individual.conflicts) * 10
        fitness -= conflict_penalty
        
        # Workload balance bonus (medium weight)
        fitness += individual.workload_balance * 20
        
        # Room utilization bonus (low weight)
        fitness += individual.room_utilization * 10
        
        # Preference satisfaction bonus
        preference_bonus = self._calculate_preference_satisfaction(individual, request)
        fitness += preference_bonus * 5
        
        return max(0, fitness)
    
    def _calculate_workload_balance(self, request: OptimizationRequest, timetable_slots: List[TimetableSlot]) -> float:
        """Calculate workload balance score (0-1, higher is better)"""
        workload_dist = self._calculate_workload_distribution(request, timetable_slots)
        
        if not workload_dist:
            return 0.0
        
        workloads = list(workload_dist.values())
        if len(workloads) <= 1:
            return 1.0
        
        mean_workload = sum(workloads) / len(workloads)
        variance = sum((w - mean_workload) ** 2 for w in workloads) / len(workloads)
        
        # Normalize variance to 0-1 scale (lower variance = higher balance)
        max_variance = mean_workload ** 2  # Maximum possible variance
        balance_score = 1.0 - (variance / max_variance) if max_variance > 0 else 1.0
        
        return max(0, min(1, balance_score))
    
    def _calculate_room_utilization(self, request: OptimizationRequest, timetable_slots: List[TimetableSlot]) -> float:
        """Calculate room utilization score (0-1, higher is better)"""
        if not request.rooms or not timetable_slots:
            return 0.0
        
        total_room_slots = len(request.rooms) * request.config.slots_per_day * 5  # 5 days
        used_room_slots = len(timetable_slots)
        
        return min(1.0, used_room_slots / total_room_slots)
    
    def _calculate_preference_satisfaction(self, individual: Individual, request: OptimizationRequest) -> float:
        """Calculate preference satisfaction score (0-1, higher is better)"""
        # Simplified preference calculation
        # Future: Add time slot preferences, faculty course preferences, etc.
        return 0.5  # Placeholder
    
    def _selection(self, population: List[Individual]) -> List[Individual]:
        """Tournament selection"""
        selected = []
        tournament_size = 5
        
        for _ in range(self.population_size):
            tournament = random.sample(population, min(tournament_size, len(population)))
            winner = max(tournament, key=lambda x: x.fitness)
            selected.append(winner)
        
        return selected
    
    def _crossover_and_mutation(self, population: List[Individual], request: OptimizationRequest) -> List[Individual]:
        """Apply crossover and mutation operations"""
        new_population = []
        
        for i in range(0, len(population), 2):
            parent1 = population[i]
            parent2 = population[i + 1] if i + 1 < len(population) else population[0]
            
            if random.random() < self.crossover_rate:
                child1, child2 = self._crossover(parent1, parent2, request)
            else:
                child1, child2 = parent1, parent2
            
            if random.random() < self.mutation_rate:
                child1 = self._mutate(child1, request)
            if random.random() < self.mutation_rate:
                child2 = self._mutate(child2, request)
            
            new_population.extend([child1, child2])
        
        return new_population[:self.population_size]
    
    def _crossover(self, parent1: Individual, parent2: Individual, request: OptimizationRequest) -> Tuple[Individual, Individual]:
        """Single-point crossover"""
        # Simple crossover: split timetables at random point
        crossover_point = random.randint(1, min(len(parent1.timetable_slots), len(parent2.timetable_slots)) - 1)
        
        child1_slots = parent1.timetable_slots[:crossover_point] + parent2.timetable_slots[crossover_point:]
        child2_slots = parent2.timetable_slots[:crossover_point] + parent1.timetable_slots[crossover_point:]
        
        return Individual(child1_slots), Individual(child2_slots)
    
    def _mutate(self, individual: Individual, request: OptimizationRequest) -> Individual:
        """Random mutation"""
        if not individual.timetable_slots:
            return individual
        
        # Select random slot to mutate
        slot_index = random.randint(0, len(individual.timetable_slots) - 1)
        slot = individual.timetable_slots[slot_index]
        
        # Create new mutated slot
        new_slot = TimetableSlot(
            day=random.choice(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
            time_start=slot.time_start,
            time_end=slot.time_end,
            course_id=slot.course_id,
            faculty_id=random.choice(request.faculty).id,
            room_id=random.choice(request.rooms).id,
            student_groups=slot.student_groups
        )
        
        # Replace slot
        new_slots = individual.timetable_slots.copy()
        new_slots[slot_index] = new_slot
        
        return Individual(new_slots)
    
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