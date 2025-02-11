#!/bin/bash

# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build TypeScript
npm run build

# Navigate to frontend directory
cd ../frontend/wazo-notes

# Install frontend dependencies
npm install

# Build frontend
npm run build

# Create public directory in root and copy frontend build
cd ../..
mkdir -p public
cp -r frontend/wazo-notes/build/* public/
