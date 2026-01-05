#!/bin/bash

# Port 3000 Cleanup Script
# Finds and kills any process using port 3000

echo "🔍 Checking port 3000..."
echo ""

# Check what's using port 3000
if command -v lsof &> /dev/null; then
    # macOS/Linux with lsof
    PID=$(lsof -ti :3000)

    if [ -z "$PID" ]; then
        echo "✅ Port 3000 is available (nothing using it)"
        exit 0
    fi

    echo "⚠️  Port 3000 is in use by process: $PID"
    echo ""

    # Show what's running
    echo "Process details:"
    lsof -i :3000
    echo ""

    # Ask to kill
    read -p "Kill this process? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill -9 $PID
        sleep 1

        # Verify
        if lsof -ti :3000 &> /dev/null; then
            echo "❌ Failed to kill process"
            exit 1
        else
            echo "✅ Port 3000 is now available"
            echo ""
            echo "You can now run:"
            echo "  npm run ui"
            exit 0
        fi
    else
        echo "Process not killed. Port 3000 is still in use."
        exit 1
    fi

elif command -v netstat &> /dev/null; then
    # Linux with netstat
    PID=$(netstat -tlnp 2>/dev/null | grep :3000 | awk '{print $7}' | cut -d'/' -f1)

    if [ -z "$PID" ]; then
        echo "✅ Port 3000 is available (nothing using it)"
        exit 0
    fi

    echo "⚠️  Port 3000 is in use by process: $PID"
    echo ""

    # Show what's running
    echo "Process details:"
    ps aux | grep $PID | grep -v grep
    echo ""

    # Ask to kill
    read -p "Kill this process? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill -9 $PID
        sleep 1

        echo "✅ Port 3000 should now be available"
        echo ""
        echo "You can now run:"
        echo "  npm run ui"
        exit 0
    else
        echo "Process not killed. Port 3000 is still in use."
        exit 1
    fi
else
    echo "❌ Cannot check port (neither lsof nor netstat found)"
    echo ""
    echo "Manual check:"
    echo "  macOS/Linux: lsof -i :3000"
    echo "  Linux alt:   netstat -tlnp | grep :3000"
    echo ""
    echo "To kill the process:"
    echo "  kill -9 <PID>"
    exit 1
fi
