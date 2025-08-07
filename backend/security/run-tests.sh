#!/bin/bash

# Security API Test Runner Script
echo "🚀 Security API Test Suite Runner"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if dependencies are installed
print_status "Checking dependencies..."
if ! npm list mocha > /dev/null 2>&1; then
    print_warning "Installing test dependencies..."
    npm install --save-dev mocha chai nyc
fi

# Check if server is running
print_status "Checking if server is running on port 3000..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    print_success "Server is running"
else
    print_warning "Server not detected. Make sure to start the server before running tests:"
    echo "  npm start"
    echo ""
fi

# Run tests based on argument
case "$1" in
    "auth")
        print_status "Running Authentication tests..."
        npm run test:auth
        ;;
    "user")
        print_status "Running User Management tests..."
        npm run test:user
        ;;
    "dashboard")
        print_status "Running Dashboard tests..."
        npm run test:dashboard
        ;;
    "roles")
        print_status "Running Role-based tests..."
        npm run test:roles
        ;;
    "security")
        print_status "Running Security tests..."
        npm run test:security
        ;;
    "integration")
        print_status "Running Integration tests..."
        npm run test:integration
        ;;
    "coverage")
        print_status "Running tests with coverage report..."
        npm run test:coverage
        ;;
    "watch")
        print_status "Running tests in watch mode..."
        npm run test:watch
        ;;
    "quick")
        print_status "Running quick tests (auth + user)..."
        npm run test:quick
        ;;
    "full")
        print_status "Running full test suite sequentially..."
        npm run test:full
        ;;
    "all"|""|*)
        print_status "Running all tests..."
        npm test
        ;;
esac

exit_code=$?

if [ $exit_code -eq 0 ]; then
    print_success "All tests completed successfully! 🎉"
else
    print_error "Some tests failed. Check output above for details."
fi

echo ""
echo "📋 Available test commands:"
echo "  npm test              - Run all tests"
echo "  npm run test:auth     - Authentication tests"
echo "  npm run test:user     - User management tests" 
echo "  npm run test:dashboard - Dashboard tests"
echo "  npm run test:roles    - Role-based tests"
echo "  npm run test:security - Security tests"
echo "  npm run test:integration - Integration tests"
echo "  npm run test:coverage - Coverage report"
echo "  npm run test:watch    - Watch mode"
echo "  npm run test:quick    - Quick tests"
echo "  npm run test:full     - Sequential full suite"
echo ""

exit $exit_code
