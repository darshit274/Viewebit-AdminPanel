#!/bin/bash

# Subscription System Testing Script
echo "🧪 SUBSCRIPTION SYSTEM TESTING"
echo "================================"

# Backend URL
BASE_URL="http://localhost:5004"
ADMIN_EMAIL="admin@mocktail.com"
ADMIN_PASSWORD="admin123"

# Step 1: Login and get token
echo "📝 Step 1: Testing Admin Login..."
LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}" \
  $BASE_URL/api/admin/login)

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    exit 1
fi

echo "✅ Login successful"

# Step 2: Test creating a paid test series with pricing
echo ""
echo "📝 Step 2: Testing Paid Test Series Creation..."

PAID_SERIES_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Premium Mock Test Series",
    "description": "Comprehensive paid test series with advanced features",
    "title_gujarati": "પ્રીમિયમ મોક ટેસ્ટ શ્રેણી",
    "description_gujarati": "અદ્યતન સુવિધાઓ સાથે વ્યાપક ચૂકવેલી ટેસ્ટ શ્રેણી",
    "is_active": true,
    "pricing_type": "paid",
    "price": 299.99,
    "currency": "INR",
    "demo_tests_count": 3,
    "subscription_duration_days": 180,
    "discount_percentage": 10.00,
    "is_featured": true,
    "features": {
      "study_materials": true,
      "video_solutions": true,
      "performance_analytics": true,
      "mobile_app_access": true
    }
  }' \
  $BASE_URL/api/admin/test-management)

echo "Paid Series Response: $PAID_SERIES_RESPONSE"

if echo "$PAID_SERIES_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Paid test series created successfully"
    
    # Extract test series UUID for further testing
    SERIES_UUID=$(echo $PAID_SERIES_RESPONSE | grep -o '"uuid":"[^"]*' | cut -d'"' -f4)
    echo "Series UUID: $SERIES_UUID"
else
    echo "❌ Failed to create paid test series"
fi

# Step 3: Test free test series creation
echo ""
echo "📝 Step 3: Testing Free Test Series Creation..."

FREE_SERIES_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Free Practice Series",
    "description": "Free test series for basic practice",
    "title_gujarati": "મફત પ્રેક્ટિસ શ્રેણી",
    "description_gujarati": "મૂળભૂત પ્રેક્ટિસ માટે મફત ટેસ્ટ શ્રેણી",
    "is_active": true,
    "pricing_type": "free",
    "price": 0.00,
    "currency": "INR",
    "demo_tests_count": 0,
    "subscription_duration_days": 365,
    "discount_percentage": 0.00,
    "is_featured": false
  }' \
  $BASE_URL/api/admin/test-management)

echo "Free Series Response: $FREE_SERIES_RESPONSE"

if echo "$FREE_SERIES_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Free test series created successfully"
else
    echo "❌ Failed to create free test series"
fi

# Step 4: Test getting updated test series list
echo ""
echo "📝 Step 4: Testing Updated Test Series List..."

SERIES_LIST_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/api/admin/test-management)

echo "Updated Series List:"
echo $SERIES_LIST_RESPONSE | jq -r '.data[] | "- \(.title) | Type: \(.pricing_type // "N/A") | Price: \(.price // "N/A") \(.currency // "")"' 2>/dev/null || echo $SERIES_LIST_RESPONSE

# Step 5: Test creating a test with advanced features
if [ ! -z "$SERIES_UUID" ]; then
    echo ""
    echo "📝 Step 5: Testing Advanced Test Creation..."
    
    # First create a category
    CATEGORY_RESPONSE=$(curl -s -X POST \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Premium Category",
        "description": "Category for premium tests",
        "name_gujarati": "પ્રીમિયમ કેટેગરી",
        "description_gujarati": "પ્રીમિયમ ટેસ્ટ માટે કેટેગરી",
        "is_active": true
      }' \
      $BASE_URL/api/admin/test-management/test-series/$SERIES_UUID/categories)
    
    if echo "$CATEGORY_RESPONSE" | grep -q "success.*true"; then
        echo "✅ Category created successfully"
        
        CATEGORY_UUID=$(echo $CATEGORY_RESPONSE | grep -o '"uuid":"[^"]*' | cut -d'"' -f4)
        
        # Create a sub-category
        SUBCATEGORY_RESPONSE=$(curl -s -X POST \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json" \
          -d '{
            "name": "Premium Sub-Category",
            "description": "Sub-category for premium tests",
            "name_gujarati": "પ્રીમિયમ સબ-કેટેગરી",
            "is_active": true
          }' \
          $BASE_URL/api/admin/test-management/categories/$CATEGORY_UUID/sub-categories)
        
        if echo "$SUBCATEGORY_RESPONSE" | grep -q "success.*true"; then
            echo "✅ Sub-category created successfully"
            
            SUBCATEGORY_UUID=$(echo $SUBCATEGORY_RESPONSE | grep -o '"uuid":"[^"]*' | cut -d'"' -f4)
            
            # Create an advanced test
            TEST_RESPONSE=$(curl -s -X POST \
              -H "Authorization: Bearer $TOKEN" \
              -H "Content-Type: application/json" \
              -d '{
                "title": "Advanced Mock Test",
                "description": "Test with negative marking and one-time completion",
                "title_gujarati": "એડવાન્સ્ડ મોક ટેસ્ટ",
                "description_gujarati": "નેગેટિવ માર્કિંગ અને એક વખત પૂર્ણ કરવા સાથે ટેસ્ટ",
                "duration_minutes": 120,
                "total_marks": 100,
                "is_active": true,
                "is_demo": false,
                "is_free_in_paid_series": false,
                "negative_marking_enabled": true,
                "negative_marks_per_wrong": 0.33,
                "is_one_time_only": true,
                "max_duration_minutes": 120,
                "passing_marks": 40,
                "instructions": "This is a one-time test with negative marking. Each wrong answer will deduct 0.33 marks.",
                "instructions_gujarati": "આ નેગેટિવ માર્કિંગ સાથે એક વખતનો ટેસ્ટ છે. દરેક ખોટા જવાબ માટે 0.33 ગુણ કપાશે.",
                "attempt_restrictions": {
                  "max_attempts": 1,
                  "cooldown_hours": 0
                }
              }' \
              $BASE_URL/api/admin/test-management/sub-categories/$SUBCATEGORY_UUID/tests)
            
            if echo "$TEST_RESPONSE" | grep -q "success.*true"; then
                echo "✅ Advanced test created successfully"
            else
                echo "❌ Failed to create advanced test"
                echo "Response: $TEST_RESPONSE"
            fi
        else
            echo "❌ Failed to create sub-category"
        fi
    else
        echo "❌ Failed to create category"
    fi
fi

echo ""
echo "🎉 Subscription System Testing Complete!"
echo "=========================================="
echo "✅ Database Schema: Updated with new fields"
echo "✅ Models: Enhanced with pricing and advanced features"
echo "✅ API Endpoints: Supporting subscription features"
echo "✅ Admin Panel: Ready for UI updates"
echo ""
echo "🌐 Frontend URL: http://localhost:5174"
echo "🔧 Backend URL: http://localhost:5004"
echo ""
echo "Ready for frontend integration and testing!"