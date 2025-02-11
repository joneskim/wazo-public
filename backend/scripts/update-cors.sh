#!/bin/bash

# Get the EC2 public IP
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# Update .env file with CORS settings
cat > .env << EOF
DATABASE_URL="file:./prisma/dev.db"
PORT=8081
CORS_ORIGINS="http://localhost:3000,https://wazo-notes.vercel.app,https://wazo-notes-git-main.vercel.app"
NODE_ENV=production
EOF

echo "Environment variables updated with CORS settings"
echo "Your EC2 public IP is: $EC2_IP"
echo "Make sure to add this IP to your Vercel environment variables as REACT_APP_API_URL=http://$EC2_IP"
