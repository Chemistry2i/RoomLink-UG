# RoomLink - Hostel Booking + Management System Backend

Production-ready backend for a comprehensive hostel booking and management platform (Airbnb-like).

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Atlas)
- **Cache**: Redis
- **Authentication**: JWT
- **Security**: Helmet, Rate Limiting, Sanitization, XSS Protection
- **Documentation**: Swagger/OpenAPI
- **Payments**: Stripe
- **Image Storage**: Cloudinary
- **Email**: Nodemailer
- **Queue**: Bull

## 📁 Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files
│   ├── modules/         # Feature modules
│   │   ├── auth/
│   │   ├── user/
│   │   ├── hostel/
│   │   ├── booking/
│   │   ├── review/
│   │   ├── complaint/
│   │   ├── report/
│   │   ├── dashboard/
│   │   └── payment/
│   ├── middlewares/     # Express middlewares
│   ├── utils/           # Utility functions
│   ├── docs/            # API documentation
│   ├── app.js           # Express app setup
│   └── routes.js        # API routes
├── tests/               # Test files
├── server.js            # Server entry point
├── package.json
├── .env                 # Environment variables
└── .gitignore
```

## 🏗 Architecture

**Feature-Based Modular Architecture**
- Each module contains: Model, Controller, Service, Routes
- Service layer for business logic separation
- Centralized error handling
- MVC + Service pattern

## 🔑 Key Features

### 1. Authentication & Authorization
- JWT-based authentication
- Role-Based Access Control (RBAC)
- Roles: user, host, staff, admin
- Password hashing with bcrypt

### 2. Booking System
- Conflict prevention (no double booking)
- MongoDB transactions for data consistency
- Room availability management
- Payment integration

### 3. Hostel Management
- Create/Update/Delete hostels
- Image upload (Cloudinary)
- Search & filtering
- Rating system

### 4. Complaint Management
- Users can file complaints
- Staff handles complaints
- Priority and category tracking
- Resolution tracking

### 5. Reporting & Analytics
- Booking reports
- Complaint reports
- Revenue analytics
- User metrics
- Dashboard for admin/host/staff

### 6. Performance Optimization
- Redis caching
- Database indexing
- Pagination
- Lean queries
- Field selection

## 🛠 Installation & Setup

### 1. Clone Repository
```bash
cd server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 4. Start Development Server
```bash
npm run dev
```

## 📦 Available Scripts

```bash
npm start           # Start production server
npm run dev         # Start with nodemon for development
npm test            # Run tests
npm test:watch      # Run tests in watch mode
npm run lint        # Run ESLint
npm run lint:fix    # Fix linting issues
```

## 🔒 Security Features

✅ Helmet - HTTP security headers
✅ Rate Limiting - Prevent brute force
✅ Data Sanitization - MongoDB injection protection
✅ XSS Protection - Cross-site scripting prevention
✅ HPP - Parameter pollution prevention
✅ CORS - Cross-origin security
✅ JWT - Stateless authentication
✅ Password hashing - bcrypt with 12 rounds

## 📊 Database Design

### Collections
- **Users** - User accounts with roles and soft delete
- **Hostels** - Hostel listings with indexing
- **Bookings** - Booking records with transaction support
- **Reviews** - User reviews with ratings
- **Complaints** - Complaint tracking system
- **Payments** - Payment records (optional)

### Indexes
All collections have optimized indexes for:
- Frequent search queries
- Sorting operations
- Join operations

## 🔐 API Authentication

All protected endpoints require:
```
Authorization: Bearer {jwt_token}
```

## 📚 API Documentation

Swagger docs available at:
```
http://localhost:5000/api-docs
```

## 🚀 Deployment

### Environment Variables Required
- NODE_ENV
- PORT
- MONGO_URI
- JWT_SECRET
- REDIS_HOST, REDIS_PORT
- STRIPE_SECRET_KEY
- CLOUDINARY_*

### Deploy to Production
```bash
npm install --production
npm start
```

## 🧪 Testing

```bash
npm test
```

## 📝 Git Workflow

- Branch naming: `feature/feature-name`, `fix/bug-name`
- Commit messages: conventional commits
- Create pull requests for review

## 📞 Support

For issues, create an issue in the repository.

## 📄 License

ISC License
