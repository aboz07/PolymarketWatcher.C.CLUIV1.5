#!/bin/bash

# Polymarket Watcher - Automated Setup Script
# This script automates the fixes for the Start Scanning function

set -e  # Exit on error

echo "🍃 Polymarket Watcher - Automated Setup"
echo "========================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo -e "${GREEN}✅ Found package.json${NC}"
echo ""

# Step 1: Check Node.js version
echo "📋 Step 1: Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18 or higher required${NC}"
    echo "Current version: $(node --version)"
    echo "Please upgrade Node.js: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js version OK: $(node --version)${NC}"
echo ""

# Step 2: Install dependencies
echo "📦 Step 2: Installing dependencies..."
echo "This may take a few minutes..."
echo ""

if npm install; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Some dependencies failed to install${NC}"
    echo "Continuing anyway - tsx should still work..."
fi
echo ""

# Step 3: Verify tsx installation
echo "🔍 Step 3: Verifying tsx installation..."
if [ -f "node_modules/.bin/tsx" ] || [ -f "node_modules/.bin/tsx.cmd" ]; then
    echo -e "${GREEN}✅ tsx is installed${NC}"
else
    echo -e "${RED}❌ tsx is not installed${NC}"
    echo "Attempting to install tsx specifically..."
    npm install tsx
fi
echo ""

# Step 4: Create .env file
echo "⚙️  Step 4: Setting up environment variables..."
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env.example .env
        echo -e "${GREEN}✅ .env file created from template${NC}"
    else
        echo "Keeping existing .env file"
    fi
else
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created from template${NC}"
fi
echo ""

# Step 5: Prompt for Discord webhook
echo "🔗 Step 5: Configuring Discord webhook..."
echo ""
echo "You need a Discord webhook URL to receive alerts."
echo "To get one:"
echo "  1. Go to your Discord server settings"
echo "  2. Navigate to Integrations → Webhooks"
echo "  3. Click 'New Webhook'"
echo "  4. Copy the webhook URL"
echo ""
read -p "Do you have a Discord webhook URL? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Enter your Discord webhook URL: " WEBHOOK_URL
    if [ -n "$WEBHOOK_URL" ]; then
        # Update .env file with the webhook URL
        if grep -q "^DISCORD_WEBHOOK_URL=" .env; then
            # Replace existing line (cross-platform sed)
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|^DISCORD_WEBHOOK_URL=.*|DISCORD_WEBHOOK_URL=$WEBHOOK_URL|" .env
            else
                sed -i "s|^DISCORD_WEBHOOK_URL=.*|DISCORD_WEBHOOK_URL=$WEBHOOK_URL|" .env
            fi
        else
            # Append if not found
            echo "DISCORD_WEBHOOK_URL=$WEBHOOK_URL" >> .env
        fi
        echo -e "${GREEN}✅ Discord webhook URL configured${NC}"
    else
        echo -e "${YELLOW}⚠️  No webhook URL provided${NC}"
        echo "You'll need to edit .env manually before starting"
    fi
else
    echo -e "${YELLOW}⚠️  Skipped webhook configuration${NC}"
    echo "Don't forget to edit .env and add your webhook URL!"
fi
echo ""

# Step 6: Verify project structure
echo "📁 Step 6: Verifying project structure..."
ERRORS=0

if [ ! -f "src/index.ts" ]; then
    echo -e "${RED}❌ src/index.ts not found${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ src/index.ts exists${NC}"
fi

if [ ! -f "desktop-ui/watcher-manager.ts" ]; then
    echo -e "${RED}❌ desktop-ui/watcher-manager.ts not found${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ desktop-ui/watcher-manager.ts exists${NC}"
fi

if [ ! -f "desktop-ui/server.ts" ]; then
    echo -e "${RED}❌ desktop-ui/server.ts not found${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ desktop-ui/server.ts exists${NC}"
fi

if [ ! -f "desktop-ui/public/app.js" ]; then
    echo -e "${RED}❌ desktop-ui/public/app.js not found${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ desktop-ui/public/app.js exists${NC}"
fi

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ Project structure verification failed${NC}"
    echo "Some files are missing. The application may not work correctly."
    exit 1
fi
echo ""

# Step 7: Test webhook (optional)
echo "🧪 Step 7: Testing configuration..."
if grep -q "^DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/" .env 2>/dev/null; then
    read -p "Test Discord webhook now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Sending test webhook..."
        npm run test:webhook || echo -e "${YELLOW}⚠️  Test webhook failed - check your URL in .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Cannot test webhook - not configured yet${NC}"
fi
echo ""

# Step 8: Summary
echo "========================================"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo ""
echo "1. If you haven't already, configure your Discord webhook:"
echo "   ${YELLOW}nano .env${NC}  (or use your preferred editor)"
echo ""
echo "2. Start the desktop UI:"
echo "   ${GREEN}npm run ui${NC}"
echo ""
echo "3. In the UI:"
echo "   • Click 'Start Scanning' button"
echo "   • Switch to 'Scanning' tab to see live logs"
echo "   • Check 'Recent Trades' tab for matching trades"
echo ""
echo "Alternative: Run in terminal (no UI):"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo "For troubleshooting, see: ${YELLOW}SETUP.md${NC}"
echo ""
echo "Happy trading! 🍃"
echo ""
