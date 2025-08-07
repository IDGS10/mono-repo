# Security API Test Suite

This directory contains comprehensive tests for the Security API system.

## 🧪 Test Structure

```
tests/
├── setup.js              # Global test configuration and utilities
├── auth.test.js           # Authentication endpoint tests
├── user.test.js           # User management tests
├── dashboard.test.js      # Dashboard API tests
├── roles.test.js          # Role-based access control tests
├── security.test.js       # Security and validation tests
├── integration.test.js    # Full integration tests
└── jwt-test.js           # JWT token validation tests
```

## 🚀 Quick Start

### Prerequisites
1. Make sure your server is running:
   ```bash
   npm start
   ```

2. Install test dependencies (if not already installed):
   ```bash
   npm install
   ```

### Running Tests

#### All Tests
```bash
npm test
```

#### Specific Test Suites
```bash
# Authentication tests
npm run test:auth

# User management tests  
npm run test:user

# Dashboard tests
npm run test:dashboard

# Role-based access tests
npm run test:roles

# Security validation tests
npm run test:security

# Integration tests
npm run test:integration
```

#### Advanced Test Options
```bash
# Watch mode (re-runs tests on file changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Quick tests (auth + user only)
npm run test:quick

# Sequential full suite
npm run test:full
```

#### Using the Test Runner Script
```bash
# Run all tests
./run-tests.sh

# Run specific test suite
./run-tests.sh auth
./run-tests.sh user
./run-tests.sh security
./run-tests.sh coverage
```

## 📋 Test Categories

### 🔐 Authentication Tests (`auth.test.js`)
- User registration with full data
- User registration with minimal data (defaults)
- Duplicate email validation
- Invalid role validation
- Missing required fields
- Email format validation
- Password length validation
- User login with valid credentials
- Invalid login attempts
- User logout functionality

### 👤 User Management Tests (`user.test.js`)
- Get user profile
- Update user profile (full and partial)
- Invalid profile updates
- Session management
- User statistics
- Authorization required tests

### 📊 Dashboard Tests (`dashboard.test.js`)
- Dashboard statistics retrieval
- Authorization validation
- Token security for dashboard access

### 🎭 Role-based Tests (`roles.test.js`)
- Role creation validation (Propietario, Lider, Encargado)
- Role update functionality
- Invalid role rejection
- Default value testing

### 🛡️ Security Tests (`security.test.js`)
- Input sanitization (email lowercase, name trimming)
- Email format validation
- Password strength enforcement
- SQL injection protection
- XSS protection
- Rate limiting (if implemented)
- Token security validation
- Error handling and information leakage prevention

### 🔗 Integration Tests (`integration.test.js`)
- System health checks
- Database connectivity
- Full authentication flows
- Concurrent operations
- Session management
- End-to-end user workflows

## 🎯 Test Data

### Valid User Roles
- `Propietario` (default)
- `Lider`
- `Encargado`

### Default Values
- `status`: "active"
- `accepted`: 0
- `orgId`: null
- `rol`: "Propietario"

### Test User Examples

**Full Registration:**
```javascript
{
  firstName: "Test",
  lastName: "User", 
  email: "test@example.com",
  password: "SecurePass123!",
  phone: "+1234567890",
  status: "active",
  rol: "Lider",
  accepted: 1,
  orgId: 123
}
```

**Minimal Registration:**
```javascript
{
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com", 
  password: "password123"
}
```

## 🔧 Configuration

### Test Configuration (`.mocharc.json`)
- Timeout: 10 seconds (15 seconds for integration tests)
- Reporter: spec
- Recursive test discovery
- Auto-exit after completion

### Environment Variables
Tests use the same `.env` file as the main application. Key variables:
- `NODE_ENV=test` (set automatically)
- `JWT_SECRET` - For token validation
- `DB_*` - Database configuration

## 📊 Coverage Report

Generate a detailed coverage report:
```bash
npm run test:coverage
```

This creates:
- Terminal coverage summary
- HTML coverage report in `coverage/` directory
- lcov report for CI/CD integration

## 🐛 Debugging Tests

### Verbose Output
```bash
npm test -- --reporter spec
```

### Debug Specific Test
```bash
npm run test:auth -- --grep "should register a new user"
```

### Watch Mode for Development
```bash
npm run test:watch
```

## 🚀 Continuous Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: |
    npm install
    npm start &
    sleep 5
    npm test
```

### Test Exit Codes
- `0` - All tests passed
- `1` - Some tests failed
- `2` - Test setup error

## 📝 Writing New Tests

### Test File Template
```javascript
const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');

describe('Your Test Suite', () => {
  let authToken;

  before(async () => {
    // Setup code
  });

  describe('Your Feature', () => {
    it('should do something', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .send(testData)
        .expect(200);

      expect(response.body).to.have.property('success', true);
    });
  });
});
```

### Test Utilities
Use helpers from `setup.js`:
```javascript
const { generateTestUser, validRoles } = require('./setup');

const testUser = generateTestUser('123');
const liderUser = generateUserWithRole('Lider', '456');
```

## 🏆 Best Practices

1. **Always test both success and failure cases**
2. **Use descriptive test names**
3. **Clean up test data when possible**
4. **Test edge cases and boundary conditions**
5. **Verify security constraints**
6. **Check response structure and data types**
7. **Test authentication and authorization**
8. **Validate input sanitization**

## 🆘 Troubleshooting

### Common Issues

**Server not running:**
```bash
# Start the server first
npm start
```

**Port conflicts:**
```bash
# Check if port 3000 is in use
lsof -i :3000
```

**Database connection issues:**
```bash
# Verify database connection in .env
npm run test:integration
```

**Token-related test failures:**
```bash
# Check JWT_SECRET in .env
npm run test:security
```

### Test Timeout Issues
Increase timeout in `.mocharc.json` or specific tests:
```javascript
this.timeout(15000); // 15 seconds
```

## 📈 Performance

- **Quick tests**: ~2-5 seconds (auth + user)
- **Full suite**: ~30-60 seconds
- **Coverage report**: +10-15 seconds

## 🎉 Success Criteria

A successful test run should show:
- ✅ All authentication flows working
- ✅ User management operations secure
- ✅ Role-based access control enforced
- ✅ Input validation preventing attacks
- ✅ Database operations reliable
- ✅ Error handling appropriate
- ✅ No information leakage in errors
