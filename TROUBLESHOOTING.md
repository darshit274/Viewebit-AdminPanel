# 🔧 Troubleshooting Guide

## ✅ Recent Fix: TypeError - Cannot read properties of undefined

**Issue:** `TestManagementPageNew.tsx:480 Uncaught TypeError: Cannot read properties of undefined (reading 'length')`

**Root Cause:** The component was trying to access `data?.data.length` before properly handling the API response structure.

**Solution Applied:**
1. **Added proper data extraction:**
   ```javascript
   const testSeries = data?.data || [];
   const stats = data?.stats;
   ```

2. **Updated all references:**
   - `totalCount={testSeries.length}` instead of `data?.data?.length`
   - `data={testSeries}` instead of `data?.data`
   - `{stats.total}` instead of `{data.stats.total}`

**Status:** ✅ **FIXED** - Admin panel should now load without errors

---

## 🚀 How to Verify Everything is Working

### 1. **Check Frontend Server**
```bash
# Should be running on http://localhost:5173
curl -s http://localhost:5173 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend Down"
```

### 2. **Check Backend Server** 
```bash
# Should be running on http://localhost:5004
curl -s http://localhost:5004 > /dev/null && echo "✅ Backend OK" || echo "❌ Backend Down"
```

### 3. **Check Admin Login**
- URL: http://localhost:5173
- Email: admin@mocktail.com  
- Password: admin123

### 4. **Verify Subscription Features**
1. **Go to:** Test Management
2. **Click:** Add Test Series
3. **You should see:**
   - 💰 Pricing & Subscription Settings section
   - Free/Paid dropdown with clear labels
   - Price configuration fields
   - Demo tests count, subscription duration, etc.

4. **Create a test series, then navigate through:**
   - Categories → Sub-Categories → Add Test
5. **You should see:**
   - ⚙️ Advanced Test Settings section
   - 🎯 Demo Test checkbox
   - 🆓 Free in Paid Series checkbox  
   - ❌ Negative Marking checkbox
   - 🔒 One-time Test checkbox

---

## 🐛 Common Issues & Solutions

### **Issue: "Authorization failed" or Login Problems**
**Solution:** 
1. Check if backend is running on port 5004
2. Verify admin credentials: admin@mocktail.com / admin123
3. Clear browser cache and sessionStorage

### **Issue: "Network Error" or API calls failing**
**Solution:**
1. Verify backend server is running
2. Check CORS settings in backend
3. Confirm API endpoints are accessible

### **Issue: Subscription features not visible in forms**
**Solution:**
1. Confirm you're on the correct URL (http://localhost:5173)
2. Check browser console for JavaScript errors
3. Verify all components are using the "New" versions (TestManagementPageNew, etc.)

### **Issue: Database errors on subscription fields**
**Solution:**
1. Ensure all migrations have been run:
   ```bash
   cd Mocktail-backend
   npx sequelize-cli db:migrate
   ```
2. Check that all 5 subscription-related migrations completed successfully

---

## 📊 Testing Workflow

### **Complete Feature Test:**

1. **Create Paid Test Series:**
   - Title: "Premium JEE Series"
   - Type: 💳 Paid  
   - Price: ₹499.99
   - Demo tests: 3
   - Duration: 180 days
   - Featured: ⭐ Yes

2. **Create Category:** "Physics"

3. **Create Sub-Category:** "Mechanics"

4. **Create Advanced Test:**
   - Title: "Kinematics Test"
   - ❌ Negative Marking: 0.25
   - 🔒 One-time Test: Yes
   - 🎯 Passing Marks: 40
   - Duration: 120 minutes

5. **Add Questions** to the test

6. **Verify in table views:**
   - Test Series shows 💳 Paid ₹499 ⭐
   - Test shows ❌ -ve Marking, 🔒 One-time badges

---

## 🎯 Success Indicators

**✅ Everything working if you see:**
- Admin panel loads without JavaScript errors
- Test series form has pricing configuration section
- Test form has advanced settings section  
- Table views show feature badges
- API calls complete successfully
- All CRUD operations work

**🎉 Ready for production use!**