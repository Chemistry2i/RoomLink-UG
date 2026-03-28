# RoomLink Frontend

Modern React frontend for RoomLink - Airbnb-like hostel booking platform.

## Features

✨ **User-Friendly Design**
- Search and filter hostels
- Browse room details and amenities
- Book accommodations with ease
- Manage your bookings and profile

🎨 **Modern Tech Stack**
- React 18
- React Router v6
- Tailwind CSS
- Axios for API calls
- Zustand for state management
- React Hot Toast for notifications

## Installation

```bash
npm install
```

## Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your backend API URL:
```
VITE_API_URL=https://curly-halibut-pjqpq9rpwv4pfv5x-5000.app.github.dev/api
```

## Development

```bash
npm run dev
```

Server runs on http://localhost:5173

## Building

```bash
npm run build
```

Optimized production build in `dist/` folder.

## Project Structure

```
src/
├── components/       # Reusable components
├── pages/           # Page components
├── store/           # Zustand state
├── config/          # Configuration files
├── App.jsx          # Main app component
└── main.jsx         # Entry point
```

## Page Overview

- **Home** - Landing page with featublue hostels
- **Search** - Search and filter hostels
- **HostelDetail** - View hostel info and rooms
- **Booking** - Book a room with dates
- **Login/Register** - Authentication
- **Dashboard** - View your bookings

## API Integration

The app connects to the RoomLink backend:

```
Backend: https://curly-halibut-pjqpq9rpwv4pfv5x-5000.app.github.dev/api
Frontend: http://localhost:5173
```

Make sure the backend is running before starting the frontend.

## Available Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Coming Soon

- Payment integration (Stripe)
- Host dashboard
- Advanced search filters
- Reviews and ratings
- Messaging system
- Wishlists
