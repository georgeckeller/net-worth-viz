# Required env var: SMOKE_TEST_PASSWORD
# Optional env vars: BASE_URL, SHEET_ID

BASE_URL=${BASE_URL:-"https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net"}
SHEET_ID=${SHEET_ID:-"YOUR_SHEET_ID"}
FRONTEND_URL=${FRONTEND_URL:-"https://YOUR_PROJECT_ID.web.app"}

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

if [ -z "$SMOKE_TEST_PASSWORD" ]; then
  echo "Error: SMOKE_TEST_PASSWORD environment variable is not set"
  echo "Usage: SMOKE_TEST_PASSWORD='yourpassword' ./smoke-test.sh"
  exit 1
fi

echo "🔥 Running Smoke Tests..."
echo ""

# Test 1: Verify password endpoint is reachable
echo -n "1. Password endpoint reachable: "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  ${BASE_URL}/verifyPassword \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d '{"password":"test"}')
if [ "$RESPONSE" = "200" ]; then
  echo -e "${GREEN}✓ OK${NC}"
else
  echo -e "${RED}✗ FAIL (HTTP $RESPONSE)${NC}"
  exit 1
fi

# Test 2: Wrong password returns valid:false
echo -n "2. Wrong password rejected: "
RESPONSE=$(curl -s -X POST \
  ${BASE_URL}/verifyPassword \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d '{"password":"wrongpassword"}')
if echo "$RESPONSE" | grep -q '"valid":false'; then
  echo -e "${GREEN}✓ OK${NC}"
else
  echo -e "${RED}✗ FAIL${NC}"
  exit 1
fi

# Test 3: Correct password returns token
echo -n "3. Correct password accepted: "
RESPONSE=$(curl -s -X POST \
  ${BASE_URL}/verifyPassword \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d "{\"password\":\"$SMOKE_TEST_PASSWORD\"}")
if echo "$RESPONSE" | grep -q '"valid":true'; then
  TOKEN=$(echo "$RESPONSE" | grep -o '"sessionToken":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}✓ OK${NC}"
else
  echo -e "${RED}✗ FAIL${NC}"
  exit 1
fi

# Get current timestamp in milliseconds
TIMESTAMP=$(date +%s)000

# Test 4: Get assets without token fails (but with CSRF header)
echo -n "4. Assets endpoint requires auth: "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  ${BASE_URL}/getAssets \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d "{\"sheetId\":\"$SHEET_ID\",\"timestamp\":$TIMESTAMP}")
if [ "$RESPONSE" = "401" ]; then
  echo -e "${GREEN}✓ OK${NC}"
else
  echo -e "${RED}✗ FAIL (HTTP $RESPONSE)${NC}"
  exit 1
fi

# Get fresh timestamp
TIMESTAMP=$(date +%s)000

# Test 5: Get assets with token succeeds
echo -n "5. Assets returned with valid token: "
RESPONSE=$(curl -s -X POST \
  ${BASE_URL}/getAssets \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "x-session-token: $TOKEN" \
  -d "{\"sheetId\":\"$SHEET_ID\",\"timestamp\":$TIMESTAMP}")
if echo "$RESPONSE" | grep -q '"assets":\['; then
  echo -e "${GREEN}✓ OK${NC}"
else
  echo -e "${RED}✗ FAIL${NC}"
  echo "Response: $RESPONSE"
  exit 1
fi

# Test 6: Frontend is accessible
echo -n "6. Frontend accessible: "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ "$RESPONSE" = "200" ]; then
  echo -e "${GREEN}✓ OK${NC}"
else
  echo -e "${RED}✗ FAIL (HTTP $RESPONSE)${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ All smoke tests passed!${NC}"
echo ""
echo "App is healthy at: $FRONTEND_URL"
