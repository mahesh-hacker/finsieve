# Authentication for Screening and Comparison Features

## Summary

Added authentication requirements to the Screening and Comparison features, making them consistent with the Watchlist feature. Users must now be logged in to access these premium features. The navigation menu now displays all three tools (Screening, Comparison, Watchlists) as greyed out when users are not authenticated.

## Changes Made

### Backend Changes

#### 1. `/finsieve-backend/src/routes/screening.routes.js`

- **Added**: Import of `authenticate` middleware
- **Added**: `router.use(authenticate)` to protect all screening endpoints
- **Effect**: All screening API endpoints now require a valid JWT token

```javascript
import { authenticate } from "../middleware/auth.middleware.js";
router.use(authenticate);
```

#### 2. `/finsieve-backend/src/routes/comparison.routes.js`

- **Added**: Import of `authenticate` middleware
- **Added**: `router.use(authenticate)` to protect all comparison endpoints
- **Effect**: All comparison API endpoints now require a valid JWT token

```javascript
import { authenticate } from "../middleware/auth.middleware.js";
router.use(authenticate);
```

### Frontend Changes

#### 3. `/finsieve-web/src/App.tsx`

- **Modified**: Wrapped `/screening` route with `ProtectedRoute` component
- **Modified**: Wrapped `/comparison` route with `ProtectedRoute` component
- **Effect**:
  - Unauthenticated users are redirected to `/login` when trying to access these pages
  - Only logged-in users can access Screening and Comparison features
  - Consistent with Watchlist feature behavior

```tsx
<Route
  path="/screening"
  element={
    <ProtectedRoute>
      <Screening />
    </ProtectedRoute>
  }
/>
<Route
  path="/comparison"
  element={
    <ProtectedRoute>
      <Comparison />
    </ProtectedRoute>
  }
/>
```

#### 4. `/finsieve-web/src/layouts/common/MainLayout.tsx`

- **Modified**: Changed `requiresAuth` to `true` for Screening and Comparison menu items
- **Removed**: "PRO" chip badge from all authenticated-required menu items
- **Effect**:
  - Screening and Comparison menu items now appear greyed out (40% opacity) when user is not authenticated
  - Clicking on greyed-out items redirects to login page
  - Cleaner UI without "PRO" badges
  - All three tools (Screening, Comparison, Watchlists) have consistent styling

```tsx
{
  label: "TOOLS",
  items: [
    {
      text: "Screening",
      icon: <FilterListIcon sx={{ fontSize: 20 }} />,
      path: "/screening",
      requiresAuth: true, // Changed from false to true
    },
    {
      text: "Comparison",
      icon: <CompareArrowsIcon sx={{ fontSize: 20 }} />,
      path: "/comparison",
      requiresAuth: true, // Changed from false to true
    },
    {
      text: "Watchlists",
      icon: <BookmarksIcon sx={{ fontSize: 20 }} />,
      path: "/watchlists",
      requiresAuth: true,
    },
  ],
}
```

## Protected Features Summary

After these changes, the following features require authentication:

1. ✅ **Watchlists** - Create, manage, and track custom watchlists
2. ✅ **Screening** - Cross-asset class screening engine
3. ✅ **Comparison** - Side-by-side instrument comparison
4. ✅ **Profile** - User profile management

## UI/UX Changes

### Navigation Menu Behavior

**For Unauthenticated Users:**

- All three tool menu items (Screening, Comparison, Watchlists) appear greyed out (40% opacity)
- No "PRO" badges displayed
- Clicking any greyed-out item redirects to `/login`

**For Authenticated Users:**

- All three tool menu items appear with full opacity and normal styling
- Active route is highlighted with purple accent
- Hover effects work normally

### Visual Consistency

All authenticated-required features now have:

- Consistent opacity styling (40% when locked, 100% when accessible)
- No badge clutter
- Clean, minimal design
- Immediate visual feedback of which features require login

## Technical Details

### Authentication Flow

1. User attempts to access `/screening` or `/comparison`
2. Frontend `ProtectedRoute` checks Redux auth state
3. If not authenticated → Redirect to `/login`
4. If authenticated → Render the page
5. API calls include JWT token in `Authorization` header (handled by `apiService`)
6. Backend middleware validates token before processing request

### Error Handling

- **401 Unauthorized**: If token is invalid/expired, user is automatically logged out
- **Token Refresh**: Automatic token refresh handled by `apiService` interceptors
- **User Experience**: Seamless redirect to login with return path preserved

## Testing Checklist

- [ ] Verify Screening menu item is greyed out when not logged in
- [ ] Verify Comparison menu item is greyed out when not logged in
- [ ] Verify Watchlists menu item is greyed out when not logged in
- [ ] Verify no "PRO" badges appear on any menu items
- [ ] Verify clicking greyed-out items redirects to login
- [ ] Verify unauthenticated users cannot access `/screening`
- [ ] Verify unauthenticated users cannot access `/comparison`
- [ ] Verify authenticated users can access all three tools
- [ ] Verify all menu items have full opacity when logged in
- [ ] Verify API calls include proper authentication headers
- [ ] Verify token refresh works correctly
- [ ] Verify proper error messages on authentication failure

## API Endpoints Protected

### Screening Endpoints

- `GET /api/v1/screening/params/:assetClass` - Get screening parameters
- `POST /api/v1/screening/run` - Run screening query
- `GET /api/v1/screening/quick` - Get quick screens
- `GET /api/v1/screening/quick/:screenId` - Run quick screen
- `GET /api/v1/screening/asset-classes` - Get supported asset classes

### Comparison Endpoints

- `POST /api/v1/comparison` - Compare instruments
- `GET /api/v1/comparison/search` - Search for comparison

## Benefits

1. **Monetization Ready**: Premium features gated behind authentication
2. **User Tracking**: Can track feature usage per user
3. **Data Security**: Prevent unauthorized access to screening algorithms
4. **Consistent UX**: Same authentication pattern across all premium features
5. **Analytics**: Better understanding of user behavior and engagement

## Migration Notes

- Existing users: No action required - authentication flow is transparent
- New users: Must register/login to access Screening and Comparison
- API consumers: Must include valid JWT token in requests
- No database migrations required
- No configuration changes required

---

**Date**: February 11, 2026
**Modified by**: GitHub Copilot
**Status**: ✅ Complete
