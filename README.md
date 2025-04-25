# Wardley Maps Generator

A web application that generates Wardley Maps from text descriptions and analyzes value chains based on component positions.

## Quick Start with Docker

The easiest way to run the application is using Docker Compose:

```bash
# Clone the repository
git clone <repository-url>
cd wardley-maps-generator

# Start the application
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## MacBook Deployment (Recommended)

For a smooth experience on macOS, we've created simple scripts to handle deployment:

```bash
# Make scripts executable
chmod +x setup.sh cleanup.sh

# Start the application
./setup.sh

# When you're done, clean up
./cleanup.sh
```

### Requirements

- macOS 10.15 (Catalina) or newer
- [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
- At least 4GB of free RAM
- 1GB of free disk space

### Features

- **One-click deployment**: Just run `./setup.sh` to get started
- **Persistent data**: Your maps are saved in a PostgreSQL database
- **Easy cleanup**: Run `./cleanup.sh` when you're done
- **Optimized for macOS**: Works seamlessly with Docker Desktop for Mac

## Manual Setup

If you prefer to run the application without Docker:

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Architecture

The application consists of two main components:

### Frontend (React)
- Text input interface for map description
- Interactive Wardley Map visualization using D3.js
- Position-based analysis display
- Real-time map updates

### Backend (FastAPI)
- Text processing and parsing
- Map structure generation
- Position-based analysis engine
- RESTful API endpoints

## Features
- Text-to-Map conversion
- Interactive component positioning
- Value chain analysis
- Position-based property inference
- Relationship visualization
- Export capabilities

## Getting Started

1. Start the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

2. Start the frontend:
```bash
cd frontend
npm install
npm start
```
