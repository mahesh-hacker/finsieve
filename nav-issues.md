# Finsieve Navigation Issues Audit

## Issue 1 — Scroll position not reset when navigating within MainLayout [FIXED]
**File:** `finsieve-web/src/layouts/common/MainLayout.tsx`
**Root cause:** The main content area uses `overflowY: "auto"` on an inner `Box`, not `window`. When navigating between pages that share this layout (Dashboard -> Pricing, etc.) the scroll position from the previous page persists.
**Symptom:** Clicking "Start 14-Day Free Trial" from a scrolled-down state opens `/pricing` at the comparison table instead of the top.
**Fix:** Added `ref={contentRef}` to the content Box and a `useEffect` on `location.pathname` that calls `contentRef.current?.scrollTo(0, 0)` on every navigation.

## Issue 2 — `window.scrollTo(0, 0)` in Pricing.tsx is ineffective [FIXED]
**File:** `finsieve-web/src/pages/pricing/Pricing.tsx`
**Root cause:** This targeted `window`, but the real scroll container is the inner Box in MainLayout.
**Fix:** Removed — scroll reset is now handled at the layout level (Issue 1 fix), covering all pages.

## Issue 3 — Sidebar footer always shows hardcoded "Free Plan" [FIXED]
**File:** `finsieve-web/src/layouts/common/MainLayout.tsx`
**Root cause:** Text was hardcoded as `"Free Plan"` regardless of actual user tier.
**Symptom:** Premium and Elite users saw "Free Plan" in the sidebar footer.
**Fix:** Now reads `user.userTier` via `getPlanByTier(user?.userTier ?? "FREE").name`, showing the correct plan name.

## Issue 4 — Landing page footer "Privacy", "Terms", "Disclaimer" are dead `href="#"` links [FIXED]
**File:** `finsieve-web/src/pages/landing/LandingPage.tsx`
**Root cause:** Placeholder links using `href="#"` caused the page to scroll to top, looking broken.
**Fix:** Changed to non-interactive `<span>` elements with `cursor: "default"` and a tooltip "Coming soon".
