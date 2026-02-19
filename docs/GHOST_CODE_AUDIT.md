# Pillar 1: Ghost-Code Audit

Components and modules that are **not** referenced by any app route. Safe to remove if unused, or keep for future use.

## Unused components (not imported by app routes)

| Path | Note |
|------|------|
| `src/components/DriverApp.tsx` | Legacy / alternate driver UI |
| `src/components/SimpleTest.tsx` | Test/demo |
| `src/components/RideRequestSheet.tsx` | Possibly legacy ride UI |
| `src/components/MapView.tsx` | Map wrapper; ride map uses RideMapClient + react-map-gl |
| `src/components/GoOnlineButton.tsx` | Dashboard has inline go-online; duplicate |
| `src/components/DriverDashboard.tsx` | Dashboard page is inline; duplicate |
| `src/components/DriverWorkflow.tsx` | Workflow variant |
| `src/components/WaitingTimer.tsx` | Timer UI |
| `src/components/screens/HomeScreen.tsx` | Screen variant |
| `src/components/screens/TripScreen.tsx` | Screen variant |
| `src/components/screens/PickupScreen.tsx` | Screen variant |
| `src/components/screens/SummaryScreen.tsx` | Screen variant |
| `src/components/screens/OfferScreen.tsx` | Screen variant |
| `src/components/SidebarNavigation.tsx` | Nav variant |
| `src/components/HUD.tsx` | HUD overlay |
| `src/components/SOSShield.tsx` | Emergency feature (optional) |
| `src/components/ui/SlideToConfirm.tsx` | UI primitive |

## Used by app

- `ErrorBoundary` — root layout
- `LogoutButton` — driver dashboard, ride map
- `RideMapClient` — dynamic import from `/ride/map`

## Button states (Pillar 1)

All critical flows have Idle / Loading / Error; Success is implicit (redirect or state clear).

- Login, Signup: `loading`, `error`, submit disabled when loading.
- Onboarding: `loading`, `submitError`, submit disabled; success = redirect to dashboard.
- Driver dashboard: go-online `toggling`; accept/decline `accepting`/`declining`; load `loadError` + retry.
- Ride map: `requesting`, `requestError`; success = overlay + polling.
- Logout: `loggingOut`, disabled.
