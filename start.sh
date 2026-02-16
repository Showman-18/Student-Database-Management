#!/bin/bash

# Student Management System Startup Script

echo "======================================"
echo "Student Management System"
echo "======================================"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "Starting backend and frontend on macOS..."
    
    # Start backend
    echo "Starting backend server..."
    cd backend && npm run dev &
    BACKEND_PID=$!
    
    # Wait a moment for backend to start
    sleep 2
    
    # Start frontend
    echo "Starting frontend server..."
    cd ../frontend && npm run dev &
    FRONTEND_PID=$!
    
    echo ""
    echo "======================================"
    echo "✓ Server Started!"
    echo "======================================"
    echo ""
    echo "Backend: http://localhost:5000"
    echo "Frontend: http://localhost:5173"
    echo ""
    echo "Default credentials:"
    echo "  Username: admin"
    echo "  Password: admin123"
    echo ""
    echo "Press Ctrl+C to stop both servers"
    echo ""
    
    # Wait for both processes
    wait
else
    echo "This script is optimized for macOS"
    echo "For other platforms, start backend and frontend separately:"
    echo "  Backend: cd backend && npm run dev"
    echo "  Frontend: cd frontend && npm run dev"
fi
