#!/bin/bash

# Server Diagnostic Script
echo "🔍 Server Diagnostic Tool"
echo "========================="

SERVER="portal.wisling.com"
BASE_URL="https://$SERVER"

echo "Testing server responses..."
echo ""

# Test 1: Main directory
echo "1. Testing main directory:"
curl -I "$BASE_URL/ui/" 2>/dev/null | head -1
echo ""

# Test 2: Direct HTML file
echo "2. Testing direct HTML file:"
curl -I "$BASE_URL/ui/index.html" 2>/dev/null | head -1
echo ""

# Test 3: Favicon
echo "3. Testing favicon:"
curl -I "$BASE_URL/ui/favicon.ico" 2>/dev/null | head -1
echo ""

# Test 4: CSS file
echo "4. Testing CSS file:"
curl -I "$BASE_URL/ui/assets/index-CSdWj7J3.css" 2>/dev/null | head -1
echo ""

# Test 5: JS file
echo "5. Testing JS file:"
curl -I "$BASE_URL/ui/assets/index-BIZ5bgaM.js" 2>/dev/null | head -1
echo ""

echo "📋 Results:"
echo "==========="
echo "✅ 200 OK = File exists and is accessible"
echo "❌ 404 Not Found = File not found or wrong location"
echo "❌ 403 Forbidden = Permission issue"
echo "❌ 500 Internal Server Error = Server configuration issue"
echo ""

echo "🔧 Next Steps:"
echo "=============="
echo "If all tests show 404: Files not uploaded to correct location"
echo "If some show 200, some 404: Partial upload or permission issues"
echo "If all show 403: Permission problems"
echo "If all show 500: Server configuration issues"
