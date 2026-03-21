# RoomLink System Testing Guide

## Overview
This document provides comprehensive testing guidelines for the RoomLink platform. Tests are organized by module and include unit, integration, and end-to-end tests.

## Prerequisites
- Node.js 18+
- MongoDB running locally or via Docker
- Redis running locally or via Docker
- Environment variables configured (.env.test)

## Test Setup

### 1. Install Test Dependencies
```bash
cd server
npm install --save-dev jest supertest
```

### 2. Configure Environment
```bash
cp .env.example .env.test
```

Edit `.env.test` with test credentials:
```env
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/roomlink-test
REDIS_URL=redis://localhost:6379
JWT_SECRET=test-secret-key
```

### 3. Start Test Services

**Using Docker:**
```bash
docker-compose -f docker-compose.test.yml up
```

**Using Local Services:**
```bash
# Terminal 1: MongoDB
mongod --dbpath ./data/mongodb

# Terminal 2: Redis
redis-server

# Terminal 3: Run tests
cd server
npm test
```

## Test Structure

### Directory Layout
```
src/
├── __tests__/
│   ├── setup.js              # Jest configuration
│   ├── auth.role.test.js      # Auth & role tests
│   ├── payment.test.js        # Payment tests
│   ├── upload.test.js         # Upload tests
│   ├── booking.test.js        # Booking tests
│   └── integration.test.js    # End-to-end tests
└── ...
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test -- auth.role.test.js
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should register user"
```

## Test Categories

### 1. Authentication Tests
- User registration (all roles)
- Email verification
- Login/logout
- Password reset
- 2FA setup/verification
- Account suspension/lockout
- Brute-force protection

**Run:**
```bash
npm test -- auth.role.test.js
```

### 2. Role-Based Access Control Tests
- Role hierarchy validation
- Permission checks
- Staff type validation
- Hostel assignment
- Admin operations

**Run:**
```bash
npm test -- role.test.js
```

### 3. File Upload Tests
- Single file upload
- Multiple file upload
- File validation
- File deletion
- Cloudinary integration

**Run:**
```bash
npm test -- upload.test.js
```

### 4. Payment Integration Tests
- M-Pesa payment initiation
- Payment status checking
- Callback processing
- Refund requests
- Transaction history

**Run:**
```bash
npm test -- payment.test.js
```

### 5. Booking Tests
- Create booking
- Update booking
- Cancel booking
- Payment integration
- Availability checking

**Run:**
```bash
npm test -- booking.test.js
```

### 6. Integration Tests
- Full user journey
- Multi-step workflows
- Email notifications
- Error handling

**Run:**
```bash
npm test -- integration.test.js
```

## Test Coverage Goals

| Module | Target | Current |
|--------|--------|---------|
| Auth | 95% | TBD |
| User | 90% | TBD |
| Payment | 85% | TBD |
| Booking | 85% | TBD |
| Upload | 90% | TBD |
| Overall | 80% | TBD |

## Key Test Scenarios

### Authentication Flow
```javascript
1. Register new user (email verification required)
2. Verify email token
3. Login with credentials
4. Check account status (active/suspended/locked)
5. Implement 2FA if enabled
6. Generate JWT token
```

### Payment Flow
```javascript
1. Initiate payment with phone number
2. Receive STK Push prompt
3. Enter M-Pesa PIN
4. Check payment status
5. Verify payment callback
6. Update booking status
```

### File Upload Flow
```javascript
1. Select file (validate size, type)
2. Upload to multer storage
3. Send to Cloudinary
4. Return secure URL
5. Clean up temp file
```

### Staff Assignment Flow
```javascript
1. Create staff user with type
2. Assign to hostel with dates
3. Verify assignment
4. Update assignment dates
5. Remove from hostel
```

## Continuous Integration

Tests automatically run on:
- Every push to `main` or `develop`
- Every pull request
- Before Docker build
- Before deployment

See `.github/workflows/ci-cd.yml` for pipeline details.

## Debugging Tests

### Enable Debug Output
```bash
DEBUG=* npm test
```

### Run Single Test
```bash
npm test -- --testNamePattern="specific test name"
```

### Use Node Debugger
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in browser.

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# Clear test database
mongosh --eval "db.dropDatabase()"
```

### Redis Connection Issues
```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG
```

### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean up resources after each test
3. **Mocking**: Mock external services (Cloudinary, Brevo, M-Pesa)
4. **Naming**: Use descriptive test names
5. **Assertions**: Use multiple assertions but keep tests focused
6. **Speed**: Aim for tests to complete in < 5 seconds each

## Code Coverage Report

After running tests with coverage:
```bash
open coverage/lcov-report/index.html
```

## Contributing Tests

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain > 80% coverage
4. Update this guide if adding new test categories
5. Run full test suite before creating PR

## Contact & Support

For test-related issues:
- Check existing test documentation
- Review similar test files
- Create an issue with test failure details
