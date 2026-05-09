#!/bin/bash

echo "🚀 Virtual Analyst Setup"
echo "========================"

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed"
  exit 1
fi
echo "✅ Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
  echo "❌ npm is not installed"
  exit 1
fi
echo "✅ npm $(npm -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
  echo ""
  echo "📝 Creating .env.local from .env.example..."
  cp .env.example .env.local
  echo "⚠️  Please edit .env.local with your credentials"
fi

# Database setup
echo ""
echo "🗄️  Setting up database..."
echo "Make sure PostgreSQL is running and DATABASE_URL is set in .env.local"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your credentials"
echo "2. Run: npm run db:init"
echo "3. Run: npm run dev"
echo ""
echo "📖 See QUICKSTART.md for detailed setup instructions"
