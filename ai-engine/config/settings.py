"""
Configuration settings for the AI/Optimization Engine
"""
import os
from typing import Dict, Any

class Settings:
    """Configuration settings for the optimization engine"""
    
    def __init__(self):
        # API Configuration
        self.API_HOST = os.getenv("AI_ENGINE_HOST", "0.0.0.0")
        self.API_PORT = int(os.getenv("AI_ENGINE_PORT", "8001"))
        self.API_WORKERS = int(os.getenv("AI_ENGINE_WORKERS", "1"))
        
        # Optimization Algorithm Configuration
        self.DEFAULT_ALGORITHM = os.getenv("DEFAULT_ALGORITHM", "csp")
        
        # CSP Solver Configuration
        self.CSP_SOLVER_TIMEOUT = int(os.getenv("CSP_SOLVER_TIMEOUT", "300"))  # 5 minutes
        self.CSP_MAX_SOLUTIONS = int(os.getenv("CSP_MAX_SOLUTIONS", "1"))
        
        # Genetic Algorithm Configuration
        self.GA_POPULATION_SIZE = int(os.getenv("GA_POPULATION_SIZE", "100"))
        self.GA_GENERATIONS = int(os.getenv("GA_GENERATIONS", "1000"))
        self.GA_MUTATION_RATE = float(os.getenv("GA_MUTATION_RATE", "0.1"))
        self.GA_CROSSOVER_RATE = float(os.getenv("GA_CROSSOVER_RATE", "0.8"))
        self.GA_TIMEOUT = int(os.getenv("GA_TIMEOUT", "600"))  # 10 minutes
        
        # ILP Solver Configuration
        self.ILP_SOLVER_TIMEOUT = int(os.getenv("ILP_SOLVER_TIMEOUT", "300"))  # 5 minutes
        self.ILP_MIP_GAP = float(os.getenv("ILP_MIP_GAP", "0.01"))  # 1% optimality gap
        
        # Logging Configuration
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
        self.LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        
        # Performance Configuration
        self.MAX_PARALLEL_JOBS = int(os.getenv("MAX_PARALLEL_JOBS", "4"))
        self.RESULT_CACHE_TTL = int(os.getenv("RESULT_CACHE_TTL", "3600"))  # 1 hour
        
        # Timetable Configuration Defaults
        self.DEFAULT_SLOT_DURATION = int(os.getenv("DEFAULT_SLOT_DURATION", "50"))  # minutes
        self.DEFAULT_COLLEGE_START = os.getenv("DEFAULT_COLLEGE_START", "08:30")
        self.DEFAULT_COLLEGE_END = os.getenv("DEFAULT_COLLEGE_END", "17:30")
        self.DEFAULT_SLOTS_PER_DAY = int(os.getenv("DEFAULT_SLOTS_PER_DAY", "8"))
        self.DEFAULT_LUNCH_DURATION = int(os.getenv("DEFAULT_LUNCH_DURATION", "60"))  # minutes
        
        # Constraint Weights (for multi-objective optimization)
        self.WEIGHT_FACULTY_CONFLICT = float(os.getenv("WEIGHT_FACULTY_CONFLICT", "100.0"))
        self.WEIGHT_ROOM_CONFLICT = float(os.getenv("WEIGHT_ROOM_CONFLICT", "100.0"))
        self.WEIGHT_STUDENT_CONFLICT = float(os.getenv("WEIGHT_STUDENT_CONFLICT", "90.0"))
        self.WEIGHT_WORKLOAD_BALANCE = float(os.getenv("WEIGHT_WORKLOAD_BALANCE", "20.0"))
        self.WEIGHT_PREFERENCE_SATISFACTION = float(os.getenv("WEIGHT_PREFERENCE_SATISFACTION", "10.0"))
        self.WEIGHT_ROOM_UTILIZATION = float(os.getenv("WEIGHT_ROOM_UTILIZATION", "5.0"))
        
        # Integration Configuration
        self.MAIN_API_URL = os.getenv("MAIN_API_URL", "http://localhost:5000")
        self.ENABLE_INTEGRATION = os.getenv("ENABLE_INTEGRATION", "true").lower() == "true"
        
    def get_algorithm_config(self, algorithm: str) -> Dict[str, Any]:
        """Get configuration for specific algorithm"""
        configs = {
            "csp": {
                "timeout": self.CSP_SOLVER_TIMEOUT,
                "max_solutions": self.CSP_MAX_SOLUTIONS
            },
            "genetic": {
                "population_size": self.GA_POPULATION_SIZE,
                "generations": self.GA_GENERATIONS,
                "mutation_rate": self.GA_MUTATION_RATE,
                "crossover_rate": self.GA_CROSSOVER_RATE,
                "timeout": self.GA_TIMEOUT
            },
            "ilp": {
                "timeout": self.ILP_SOLVER_TIMEOUT,
                "mip_gap": self.ILP_MIP_GAP
            }
        }
        
        return configs.get(algorithm, {})
    
    def get_constraint_weights(self) -> Dict[str, float]:
        """Get constraint weights for optimization"""
        return {
            "faculty_conflict": self.WEIGHT_FACULTY_CONFLICT,
            "room_conflict": self.WEIGHT_ROOM_CONFLICT,
            "student_conflict": self.WEIGHT_STUDENT_CONFLICT,
            "workload_balance": self.WEIGHT_WORKLOAD_BALANCE,
            "preference_satisfaction": self.WEIGHT_PREFERENCE_SATISFACTION,
            "room_utilization": self.WEIGHT_ROOM_UTILIZATION
        }

# Global settings instance
settings = Settings()