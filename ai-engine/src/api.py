"""
FastAPI application for AI/Optimization Engine
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional
import asyncio
import json
from .optimization_engine import OptimizationEngine
from .models import OptimizationRequest, OptimizationResult, TimetableConfig

app = FastAPI(
    title="AI Timetable Optimization Engine",
    description="AI-powered timetable generation and optimization service",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize optimization engine
optimization_engine = OptimizationEngine()

# Store for async optimization results
optimization_results: Dict[str, OptimizationResult] = {}

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "AI Timetable Optimization Engine",
        "status": "running",
        "available_algorithms": optimization_engine.get_available_algorithms()
    }

@app.get("/algorithms")
async def get_algorithms():
    """Get available optimization algorithms"""
    algorithms = optimization_engine.get_available_algorithms()
    algorithm_info = {}
    
    for algorithm in algorithms:
        algorithm_info[algorithm] = optimization_engine.get_algorithm_info(algorithm)
    
    return {
        "algorithms": algorithms,
        "details": algorithm_info,
        "default": "csp"
    }

@app.post("/optimize", response_model=OptimizationResult)
async def optimize_timetable(request: OptimizationRequest, algorithm: Optional[str] = None):
    """
    Optimize timetable synchronously
    
    Args:
        request: OptimizationRequest with all input data
        algorithm: Optional algorithm to use ('csp', 'genetic', 'ilp')
        
    Returns:
        OptimizationResult with generated timetable
    """
    try:
        # Validate request
        violations = optimization_engine.validate_request(request)
        if violations:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Request validation failed",
                    "violations": violations
                }
            )
        
        # Run optimization
        result = optimization_engine.optimize(request, algorithm)
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Optimization failed",
                "error": str(e)
            }
        )

@app.post("/optimize/async")
async def optimize_timetable_async(
    request: OptimizationRequest, 
    background_tasks: BackgroundTasks,
    algorithm: Optional[str] = None,
    job_id: Optional[str] = None
):
    """
    Start asynchronous timetable optimization
    
    Args:
        request: OptimizationRequest with all input data
        background_tasks: FastAPI background tasks
        algorithm: Optional algorithm to use
        job_id: Optional job ID for tracking
        
    Returns:
        Job information for tracking progress
    """
    import uuid
    
    if job_id is None:
        job_id = str(uuid.uuid4())
    
    try:
        # Validate request
        violations = optimization_engine.validate_request(request)
        if violations:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Request validation failed",
                    "violations": violations
                }
            )
        
        # Store initial result
        optimization_results[job_id] = OptimizationResult(
            success=False,
            message="Optimization in progress",
            timetable_slots=[],
            execution_time_seconds=0.0,
            algorithm_used=algorithm or "unknown",
            optimization_score=0.0
        )
        
        # Add background task
        background_tasks.add_task(run_optimization_async, job_id, request, algorithm)
        
        return {
            "job_id": job_id,
            "status": "started",
            "message": "Optimization started in background"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Failed to start optimization",
                "error": str(e)
            }
        )

@app.get("/optimize/status/{job_id}")
async def get_optimization_status(job_id: str):
    """
    Get status of asynchronous optimization
    
    Args:
        job_id: Job ID from async optimization request
        
    Returns:
        Current status and result if completed
    """
    if job_id not in optimization_results:
        raise HTTPException(
            status_code=404,
            detail={"message": f"Job {job_id} not found"}
        )
    
    result = optimization_results[job_id]
    
    if result.message == "Optimization in progress":
        return {
            "job_id": job_id,
            "status": "running",
            "message": "Optimization still in progress"
        }
    elif result.success:
        return {
            "job_id": job_id,
            "status": "completed",
            "result": result
        }
    else:
        return {
            "job_id": job_id,
            "status": "failed",
            "result": result
        }

@app.post("/optimize/compare")
async def compare_algorithms(request: OptimizationRequest):
    """
    Compare optimization results across all algorithms
    
    Args:
        request: OptimizationRequest with all input data
        
    Returns:
        Comparison of results from all algorithms
    """
    try:
        # Validate request
        violations = optimization_engine.validate_request(request)
        if violations:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Request validation failed", 
                    "violations": violations
                }
            )
        
        # Run optimization with all algorithms
        results = optimization_engine.optimize_with_multiple_algorithms(request)
        best_result = optimization_engine.get_best_result(results)
        
        # Calculate comparison metrics
        comparison = {
            "results": results,
            "best_algorithm": best_result.algorithm_used,
            "best_score": best_result.optimization_score,
            "summary": {
                "successful_algorithms": [name for name, result in results.items() if result.success],
                "failed_algorithms": [name for name, result in results.items() if not result.success],
                "execution_times": {name: result.execution_time_seconds for name, result in results.items()},
                "scores": {name: result.optimization_score for name, result in results.items() if result.success}
            }
        }
        
        return comparison
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Algorithm comparison failed",
                "error": str(e)
            }
        )

@app.post("/validate")
async def validate_optimization_request(request: OptimizationRequest):
    """
    Validate optimization request without running optimization
    
    Args:
        request: OptimizationRequest to validate
        
    Returns:
        Validation result with any constraint violations
    """
    try:
        violations = optimization_engine.validate_request(request)
        
        return {
            "valid": len(violations) == 0,
            "violations": violations,
            "request_summary": {
                "courses": len(request.courses),
                "faculty": len(request.faculty),
                "rooms": len(request.rooms),
                "students": len(request.students),
                "objectives": request.objectives
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Validation failed",
                "error": str(e)
            }
        )

@app.get("/config/default")
async def get_default_config():
    """Get default timetable configuration"""
    return TimetableConfig()

async def run_optimization_async(job_id: str, request: OptimizationRequest, algorithm: Optional[str]):
    """Background task for running optimization"""
    try:
        result = optimization_engine.optimize(request, algorithm)
        optimization_results[job_id] = result
    except Exception as e:
        optimization_results[job_id] = OptimizationResult(
            success=False,
            message=f"Optimization failed: {str(e)}",
            timetable_slots=[],
            execution_time_seconds=0.0,
            algorithm_used=algorithm or "unknown",
            optimization_score=0.0
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)