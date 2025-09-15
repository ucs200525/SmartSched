"""
Main optimization engine that coordinates different algorithms
"""
from typing import Dict, List, Optional
from .optimization.base_optimizer import BaseOptimizer
from .optimization.csp_optimizer import CSPOptimizer
from .optimization.genetic_optimizer import GeneticOptimizer
from .optimization.ilp_optimizer import ILPOptimizer
from .models import OptimizationRequest, OptimizationResult, OptimizationObjective

class OptimizationEngine:
    """Main engine that manages different optimization algorithms"""
    
    def __init__(self):
        self.optimizers: Dict[str, BaseOptimizer] = {
            'csp': CSPOptimizer(),
            'genetic': GeneticOptimizer(),
            'ilp': ILPOptimizer()
        }
        self.default_algorithm = 'csp'
    
    def get_available_algorithms(self) -> List[str]:
        """Get list of available optimization algorithms"""
        return list(self.optimizers.keys())
    
    def optimize(self, request: OptimizationRequest, algorithm: Optional[str] = None) -> OptimizationResult:
        """
        Optimize timetable using specified algorithm
        
        Args:
            request: OptimizationRequest containing all input data
            algorithm: Algorithm to use ('csp', 'genetic', 'ilp'). If None, uses default.
            
        Returns:
            OptimizationResult with generated timetable
        """
        if algorithm is None:
            algorithm = self._select_best_algorithm(request)
        
        if algorithm not in self.optimizers:
            return OptimizationResult(
                success=False,
                message=f"Unknown algorithm: {algorithm}. Available: {list(self.optimizers.keys())}",
                timetable_slots=[],
                execution_time_seconds=0.0,
                algorithm_used=algorithm,
                optimization_score=0.0
            )
        
        optimizer = self.optimizers[algorithm]
        return optimizer.optimize(request)
    
    def optimize_with_multiple_algorithms(self, request: OptimizationRequest) -> Dict[str, OptimizationResult]:
        """
        Run optimization with multiple algorithms and compare results
        
        Args:
            request: OptimizationRequest containing all input data
            
        Returns:
            Dictionary mapping algorithm names to their results
        """
        results = {}
        
        for algorithm_name, optimizer in self.optimizers.items():
            try:
                result = optimizer.optimize(request)
                results[algorithm_name] = result
            except Exception as e:
                results[algorithm_name] = OptimizationResult(
                    success=False,
                    message=f"Algorithm {algorithm_name} failed: {str(e)}",
                    timetable_slots=[],
                    execution_time_seconds=0.0,
                    algorithm_used=algorithm_name,
                    optimization_score=0.0
                )
        
        return results
    
    def get_best_result(self, results: Dict[str, OptimizationResult]) -> OptimizationResult:
        """
        Select best result from multiple algorithm runs
        
        Args:
            results: Dictionary of algorithm results
            
        Returns:
            Best OptimizationResult based on success and score
        """
        successful_results = {name: result for name, result in results.items() if result.success}
        
        if not successful_results:
            # Return first failed result as representative
            return list(results.values())[0]
        
        # Select result with highest optimization score
        best_name = max(successful_results.keys(), 
                       key=lambda name: successful_results[name].optimization_score)
        
        return successful_results[best_name]
    
    def _select_best_algorithm(self, request: OptimizationRequest) -> str:
        """
        Select best algorithm based on problem characteristics
        
        Args:
            request: OptimizationRequest to analyze
            
        Returns:
            Name of recommended algorithm
        """
        num_courses = len(request.courses)
        num_faculty = len(request.faculty)
        num_rooms = len(request.rooms)
        
        # Problem size estimation
        problem_size = num_courses * num_faculty * num_rooms * request.config.slots_per_day * 5
        
        # Algorithm selection heuristics
        if problem_size < 1000:
            # Small problems - CSP is typically fastest and optimal
            return 'csp'
        elif problem_size < 10000:
            # Medium problems - ILP can find optimal solutions
            if OptimizationObjective.MINIMIZE_CONFLICTS in request.objectives:
                return 'ilp'
            else:
                return 'csp'
        else:
            # Large problems - Genetic algorithm for multi-objective optimization
            return 'genetic'
    
    def validate_request(self, request: OptimizationRequest) -> List[str]:
        """
        Validate optimization request across all algorithms
        
        Args:
            request: OptimizationRequest to validate
            
        Returns:
            List of validation error messages
        """
        all_violations = []
        
        for optimizer in self.optimizers.values():
            violations = optimizer.validate_constraints(request)
            all_violations.extend(violations)
        
        # Remove duplicates while preserving order
        unique_violations = []
        seen = set()
        for violation in all_violations:
            if violation not in seen:
                unique_violations.append(violation)
                seen.add(violation)
        
        return unique_violations
    
    def get_algorithm_info(self, algorithm: str) -> Dict[str, str]:
        """
        Get information about a specific algorithm
        
        Args:
            algorithm: Algorithm name
            
        Returns:
            Dictionary with algorithm information
        """
        algorithm_info = {
            'csp': {
                'name': 'Constraint Satisfaction Problem (OR-Tools)',
                'description': 'Uses constraint programming to find feasible solutions quickly',
                'best_for': 'Small to medium problems with hard constraints',
                'strengths': 'Fast, guaranteed feasible solutions, good for conflict minimization',
                'limitations': 'May not find optimal solutions for complex objectives'
            },
            'genetic': {
                'name': 'Genetic Algorithm',
                'description': 'Evolutionary algorithm for multi-objective optimization',
                'best_for': 'Large problems with multiple conflicting objectives',
                'strengths': 'Handles multiple objectives, good for workload balancing',
                'limitations': 'No guarantee of optimality, longer execution time'
            },
            'ilp': {
                'name': 'Integer Linear Programming (PuLP)',
                'description': 'Mathematical optimization for finding optimal solutions',
                'best_for': 'Medium problems with clear optimization criteria',
                'strengths': 'Optimal solutions, good for cost minimization',
                'limitations': 'May be slow for large problems, requires linear objectives'
            }
        }
        
        return algorithm_info.get(algorithm, {'error': f'Unknown algorithm: {algorithm}'})