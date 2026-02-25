#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  NET WORTH VIZ - TEST & DEPLOY SCRIPT  ${NC}"
echo -e "${YELLOW}========================================${NC}"

# Navigate to project root
cd "$(dirname "$0")/.."

echo ""
echo -e "${YELLOW}Step 1: Running Frontend Unit Tests...${NC}"
npm run test:unit
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend unit tests failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend unit tests passed${NC}"

echo ""
echo -e "${YELLOW}Step 2: Running Backend Unit Tests...${NC}"
cd functions
npm test
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend unit tests failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend unit tests passed${NC}"
cd ..

echo ""
echo -e "${YELLOW}Step 3: TypeScript Type Checking (Frontend)...${NC}"
npm run typecheck
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend TypeScript check failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend TypeScript check passed${NC}"

echo ""
echo -e "${YELLOW}Step 4: Building Backend...${NC}"
cd functions
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend build succeeded${NC}"
cd ..

echo ""
echo -e "${YELLOW}Step 5: Building Frontend...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend build succeeded${NC}"

echo ""
echo -e "${YELLOW}Step 6: Running Integration Tests...${NC}"
cd functions
INTEGRATION_TESTS=true npm test -- --testPathPatterns=integration
INTEGRATION_RESULT=$?
cd ..

if [ $INTEGRATION_RESULT -ne 0 ]; then
    echo -e "${RED}⚠️ Integration tests failed - proceeding with caution${NC}"
    read -p "Continue with deployment? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Integration tests passed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 7: Deploying to Firebase...${NC}"
firebase deploy
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ ALL TESTS PASSED & DEPLOYED!       ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
# Note: Replace with your actual project URL after deployment
echo -e "App URL: ${YELLOW}https://YOUR_PROJECT_ID.web.app${NC}"
