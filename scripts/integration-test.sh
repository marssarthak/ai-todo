#!/bin/bash

# Integration test script for AI Todo Application
# Tests all components working together in a staging environment

set -e  # Exit on any error

echo "======================================"
echo "Starting Integration Tests"
echo "======================================"
echo "Date: $(date)"
echo

# Make sure we're using the test environment
export NODE_ENV=test
export NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_TEST_URL:-$NEXT_PUBLIC_SUPABASE_URL}
export NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_TEST_KEY:-$NEXT_PUBLIC_SUPABASE_ANON_KEY}

# Path to test output
TEST_OUTPUT="./integration-test-results.json"

echo "1. Running unit tests..."
npm run test -- --forceExit

echo "2. Building application..."
npm run build

echo "3. Starting application in test mode..."
npm run start &
APP_PID=$!

# Wait for the app to be ready
echo "   Waiting for application to start..."
sleep 10

echo "4. Running API health checks..."
curl -s http://localhost:3000/api/health > $TEST_OUTPUT
if grep -q "healthy" $TEST_OUTPUT; then
  echo "   ✅ API is healthy"
else
  echo "   ❌ API health check failed!"
  cat $TEST_OUTPUT
  kill $APP_PID
  exit 1
fi

echo "5. Testing authentication endpoints..."
curl -s -X POST http://localhost:3000/api/auth/session > $TEST_OUTPUT
if [ $? -eq 0 ]; then
  echo "   ✅ Auth endpoints responding"
else
  echo "   ❌ Auth endpoint test failed!"
  kill $APP_PID
  exit 1
fi

echo "6. Testing database connectivity..."
curl -s http://localhost:3000/api/test/db-connection > $TEST_OUTPUT
if grep -q "connected" $TEST_OUTPUT; then
  echo "   ✅ Database connection successful"
else
  echo "   ❌ Database connection failed!"
  cat $TEST_OUTPUT
  kill $APP_PID
  exit 1
fi

echo "7. Testing blockchain contract connectivity..."
curl -s http://localhost:3000/api/test/contract-connection > $TEST_OUTPUT
if grep -q "connected" $TEST_OUTPUT; then
  echo "   ✅ Blockchain contract connection successful"
else
  echo "   ❌ Blockchain contract connection failed!"
  cat $TEST_OUTPUT
  kill $APP_PID
  exit 1
fi

echo "8. Testing streak calculation service..."
curl -s http://localhost:3000/api/test/streak-calculation > $TEST_OUTPUT
if grep -q "calculated" $TEST_OUTPUT; then
  echo "   ✅ Streak calculation working"
else
  echo "   ❌ Streak calculation failed!"
  cat $TEST_OUTPUT
  kill $APP_PID
  exit 1
fi

echo "9. Testing achievement service..."
curl -s http://localhost:3000/api/test/achievements > $TEST_OUTPUT
if grep -q "achievement" $TEST_OUTPUT; then
  echo "   ✅ Achievement service working"
else
  echo "   ❌ Achievement service failed!"
  cat $TEST_OUTPUT
  kill $APP_PID
  exit 1
fi

# Clean up - kill the test server
echo "10. Cleaning up..."
kill $APP_PID

# Finish
echo
echo "======================================"
if [ $? -eq 0 ]; then
  echo "✅ All integration tests passed!"
else
  echo "❌ Integration tests failed!"
  exit 1
fi
echo "======================================" 