# AI/Optimization Engine for Timetable Generation

This is the AI/Optimization Engine component of the timetable generation system. It provides multiple optimization algorithms for automated timetable creation with conflict resolution and workload balancing.

## Features

- **Multiple Optimization Algorithms:**
  - Constraint Satisfaction Problem (CSP) using Google OR-Tools
  - Genetic Algorithm for multi-objective optimization
  - Integer Linear Programming (ILP) using PuLP

- **Optimization Objectives:**
  - Minimize scheduling conflicts
  - Balance faculty workload
  - Maximize room utilization
  - Minimize gaps in schedules

- **RESTful API:**
  - Synchronous and asynchronous optimization
  - Algorithm comparison
  - Request validation
  - Status tracking

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables (optional):
```bash
export AI_ENGINE_HOST=0.0.0.0
export AI_ENGINE_PORT=8001
export DEFAULT_ALGORITHM=csp
```

## Usage

### Start the API Server

```bash
# From the ai-engine directory
python -m src.api

# Or using uvicorn directly
uvicorn src.api:app --host 0.0.0.0 --port 8001
```

### API Endpoints

- `GET /` - Health check and service info
- `GET /algorithms` - Available optimization algorithms
- `POST /optimize` - Synchronous timetable optimization
- `POST /optimize/async` - Asynchronous optimization
- `GET /optimize/status/{job_id}` - Check async optimization status
- `POST /optimize/compare` - Compare all algorithms
- `POST /validate` - Validate optimization request
- `GET /config/default` - Get default configuration

### Integration with Main Application

The AI engine is designed to integrate with the main Node.js application through API endpoints. The main application can:

1. Send optimization requests with course, faculty, room, and student data
2. Receive optimized timetables with conflict detection
3. Track optimization progress for long-running jobs
4. Compare different optimization approaches

## Algorithm Selection Guide

- **CSP (Default):** Best for small to medium problems with hard constraints. Fast and guarantees feasible solutions.
- **Genetic Algorithm:** Best for large problems with multiple conflicting objectives. Good for workload balancing.
- **ILP:** Best for medium problems where you need proven optimal solutions. Good for cost minimization.

## Configuration

The engine can be configured through environment variables or the `config/settings.py` file:

- Algorithm timeouts and parameters
- Constraint weights for multi-objective optimization
- API server settings
- Integration endpoints

## Data Models

The engine uses Pydantic models for data validation:

- `OptimizationRequest`: Input data (courses, faculty, rooms, students, config)
- `OptimizationResult`: Output timetable with conflicts and metrics
- `TimetableSlot`: Individual scheduled session
- Various configuration and constraint models

## Development

### Project Structure

```
ai-engine/
├── src/
│   ├── optimization/         # Optimization algorithms
│   │   ├── base_optimizer.py
│   │   ├── csp_optimizer.py
│   │   ├── genetic_optimizer.py
│   │   └── ilp_optimizer.py
│   ├── models.py            # Data models
│   ├── optimization_engine.py # Main engine
│   └── api.py               # FastAPI application
├── config/
│   └── settings.py          # Configuration
├── tests/                   # Unit tests
├── requirements.txt         # Python dependencies
└── README.md
```

### Testing

```bash
# Run tests (when implemented)
python -m pytest tests/

# Test API endpoints
curl http://localhost:8001/
curl -X POST http://localhost:8001/validate -d @sample_request.json
```

## Future Enhancements

- Machine Learning for demand prediction
- Real-time optimization updates
- Advanced constraint modeling
- Performance optimization for large datasets
- Integration with calendar systems