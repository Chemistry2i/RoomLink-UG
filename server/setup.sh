#!/bin/bash

# Quick Start Guide for RoomLink Backend

echo "🏨 RoomLink Backend Setup"
echo "========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🔧 Setup Steps:"
echo ""
echo "1. Create .env file from template:"
echo "   cp .env.example .env"
echo ""
echo "2. Edit .env with your configuration:"
echo "   - MongoDB URI (MongoDB Atlas)"
echo "   - JWT Secret"
echo "   - Redis credentials"
echo "   - Stripe API keys"
echo "   - Cloudinary credentials"
echo ""
echo "3. Start development server:"
echo "   npm run dev"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Project overview"
echo "   - IMPLEMENTATION_GUIDE.md - Implementation roadmap"
echo "   - API Docs: http://localhost:5000/api-docs (after server starts)"
echo ""
echo "✅ Setup complete! Ready to start development."
