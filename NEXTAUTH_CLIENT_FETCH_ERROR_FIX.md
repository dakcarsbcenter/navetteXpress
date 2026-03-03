# CLIENT_FETCH_ERROR Fix Guide

## Issue
You were receiving: `[next-auth][error][CLIENT_FETCH_ERROR] "Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"`

This error occurs when next-auth's client tries to fetch from the API endpoint but receives HTML (an error page) instead of JSON.

## Fixes Applied

### 1. **Enhanced Auth Route Handler** (`src/app/api/auth/[...nextauth]/route.ts`)
   - Added explicit export format: `export const GET = handler` and `export const POST = handler`
   - Added `dynamic = "force-dynamic"` to ensure the route is never statically generated
   - Added debug logging to verify handler initialization
   - Added NEXTAUTH_SECRET validation

### 2. **Added basePath Configuration**
   - Updated `src/lib/auth.ts` to explicitly set `basePath: "/api/auth"`
   - Updated `src/components/providers/session-provider.tsx` to pass the basePath to SessionProvider

### 3. **Improved Error Handling**
   - Changed the authorize function to return `null` instead of throwing errors for missing credentials
   - This prevents next-auth from failing when basic validation fails

### 4. **Health Check Endpoint** (`src/app/api/health/route.ts`)
   - Created a simple endpoint to verify your API configuration
   - Can be accessed at: `http://localhost:3000/api/health`

## How to Test

### 1. Start Your Application
```bash
npm run dev
```

### 2. Verify Health Check
Visit `http://localhost:3000/api/health` and you should see:
```json
{
  "status": "ok",
  "timestamp": "2026-03-02T...",
  "environment": {
    "nextauthUrl": "http://localhost:3000",
    "hasSecret": true,
    "hasDatabaseUrl": true
  }
}
```

### 3. Test Authentication
1. Go to `http://localhost:3000/auth/signin`
2. Enter your credentials
3. Check the browser console for any errors
4. The authentication should now work correctly

## Environment Variables to Verify

Make sure your `.env.local` has:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<your-secret-key>
DATABASE_URL=<your-database-url>
```

## Common Causes of CLIENT_FETCH_ERROR

| Cause | Solution |
|-------|----------|
| Missing NEXTAUTH_SECRET | Generate with: `openssl rand -base64 32` |
| Wrong NEXTAUTH_URL | Must match your application URL exactly |
| Database connection failing | Verify DATABASE_URL is correct |
| API route returns 404 | Check `src/app/api/auth/[...nextauth]/route.ts` exists |
| Middleware blocking auth routes | ✅ Already configured to allow `/api/auth/*` |
| Next.js build issue with Turbopack | ✅ Fixed with `dynamic = "force-dynamic"` |

## If Issues Persist

1. **Clear cache and rebuild**:
   ```bash
   rm -r .next
   npm run build
   npm run dev
   ```

2. **Check server logs** for:
   - "✅ [Auth Route] NextAuth handler initialized" (should appear on build)
   - Database connection errors
   - Missing environment variables

3. **Verify API endpoint directly**:
   - Try accessing `http://localhost:3000/api/auth/signin` in your browser
   - Should return a 405 error (Method Not Allowed) for GET requests, not HTML 404

4. **Check browser Network tab**:
   - Look for the auth API call
   - Verify response Content-Type is `application/json`
   - Check Status Code (should be 200 or 401, not 404 or 500)

## Security Notes

The fixes maintain security best practices:
- ✅ NEXTAUTH_SECRET is still required
- ✅ Credentials are validated server-side
- ✅ JWT tokens are properly signed
- ✅ Session strategy remains secure
