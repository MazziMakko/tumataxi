# 🌍 GEO-BRIDGE IMPLEMENTATION

**Tuma Taxi Geographic Center Toggle System**

---

## 📋 OVERVIEW

The Geo-Bridge enables seamless toggling between production (Maputo, Mozambique) and testing (Carneys Point, NJ) environments without hardcoded coordinates. This allows real-time local testing while maintaining production integrity.

---

## 🎯 IMPLEMENTATION STATUS

### ✅ **Phase 1: Environment Configuration**
- **File**: `.env.example` (updated)
- **Variable**: `NEXT_PUBLIC_APP_REGION` (options: "MAPUTO" | "NJ")
- **Default**: "MAPUTO" (production)

### ✅ **Phase 2: Geo-Config File**
- **File**: `src/config/geo.ts` (created)
- **Functions**:
  - `getGeoConfig()` - Returns active region configuration
  - `isTestingRegion()` - Check if in NJ mode
  - `isProductionRegion()` - Check if in Maputo mode
  - `generateRandomCoordinates()` - Create test coordinates within radius
  - `generateSimulatedRideCoordinates()` - Generate pickup/dropoff pairs
  - `calculateDistance()` - Haversine formula for coordinate distance

### ✅ **Phase 3: Map Provider Updates**
All files with hardcoded Maputo coordinates have been updated:

| File | Status | Changes |
|------|--------|---------|
| `src/components/MapView.tsx` | ✅ Updated | Map center now uses `getGeoConfig()` |
| `src/components/RideMapClient.tsx` | ✅ Updated | Pickup/dropoff use dynamic coordinates |
| `src/store/driverStore.ts` | ✅ Updated | Initial driver location uses geo config |
| `src/app/driver/dashboard/page.tsx` | ✅ Updated | "Go Online" API uses dynamic coords |
| `src/components/screens/HomeScreen.tsx` | ✅ Updated | Mock ride offers use simulated coords |
| `src/components/RideRequestSheet.tsx` | ✅ Updated | Geolocation fallback uses geo config |
| `src/components/DriverDashboard.tsx` | ✅ Updated | Map initial view uses geo config |
| `src/app/api/ride/create/route.ts` | ✅ Updated | Default coordinates use geo config |
| `scripts/seed-users.ts` | ✅ Updated | Seed driver location uses geo config |

### ✅ **Phase 4: Simulated Ride Generator**
- **Function**: `generateSimulatedRideCoordinates()`
- **Behavior**: Generates random pickup/dropoff within 3-mile (5km) radius of active region center
- **Validation**: Ensures pickup ≠ dropoff (minimum 0.5km separation)

---

## 🚀 USAGE

### **1. Switch to New Jersey (Testing Mode)**

Create or modify `.env.local`:

```bash
NEXT_PUBLIC_APP_REGION="NJ"
```

**Result**:
- Map centers on Carneys Point, NJ (39.7136, -75.4675)
- Currency displays: USD ($)
- Timezone: America/New_York
- Locale: en-US
- All simulated rides originate within 3-mile radius of NJ center

---

### **2. Switch to Maputo (Production Mode)**

```bash
NEXT_PUBLIC_APP_REGION="MAPUTO"
```

**Result**:
- Map centers on Maputo, Mozambique (-25.9692, 32.5732)
- Currency displays: MZN
- Timezone: Africa/Maputo
- Locale: pt-MZ
- All simulated rides originate within 3-mile radius of Maputo center

---

### **3. Default Behavior**

If `NEXT_PUBLIC_APP_REGION` is not set or invalid, the system defaults to **MAPUTO** (production).

---

## 🔧 API REFERENCE

### **getGeoConfig()**

Returns the active geographic configuration object.

```typescript
import { getGeoConfig } from '@/config/geo';

const config = getGeoConfig();

console.log(config);
// {
//   region: 'NJ',
//   centerCoordinates: { lat: 39.7136, lng: -75.4675 },
//   currency: 'USD',
//   currencySymbol: '$',
//   timezone: 'America/New_York',
//   locale: 'en-US',
//   geofenceRadiusKm: 15,
//   geofenceRadiusMiles: 9.32,
//   testRadiusKm: 5,
//   testRadiusMiles: 3,
//   displayName: 'Carneys Point, NJ',
//   countryCode: 'US'
// }
```

---

### **generateSimulatedRideCoordinates()**

Generates random pickup and dropoff coordinates for testing.

```typescript
import { generateSimulatedRideCoordinates } from '@/config/geo';

const { pickup, dropoff } = generateSimulatedRideCoordinates();

console.log(pickup);  // { lat: 39.7201, lng: -75.4612 }
console.log(dropoff); // { lat: 39.7089, lng: -75.4730 }
```

**Guarantees**:
- Pickup and dropoff are within `testRadiusKm` of center (5km/3mi)
- Minimum 0.5km separation between pickup and dropoff
- Coordinates are randomized on each call

---

### **isTestingRegion() / isProductionRegion()**

Check the active region mode.

```typescript
import { isTestingRegion, isProductionRegion } from '@/config/geo';

if (isTestingRegion()) {
  console.log('Running in NJ test mode');
}

if (isProductionRegion()) {
  console.log('Running in Maputo production mode');
}
```

---

### **calculateDistance()**

Calculate the distance (in km) between two coordinates.

```typescript
import { calculateDistance } from '@/config/geo';

const coord1 = { lat: 39.7136, lng: -75.4675 };
const coord2 = { lat: 39.7201, lng: -75.4612 };

const distanceKm = calculateDistance(coord1, coord2);
console.log(`Distance: ${distanceKm.toFixed(2)} km`);
```

---

## 🧪 TESTING GUIDE

### **Test Map Rendering in NJ**

1. Set `.env.local`:
   ```bash
   NEXT_PUBLIC_APP_REGION="NJ"
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

3. Open driver dashboard:
   - Navigate to `/driver/dashboard`
   - Map should center on Carneys Point, NJ
   - Coordinates: 39.7136, -75.4675

4. Open rider UI:
   - Navigate to `/`
   - Pickup marker should be in Carneys Point area
   - All ride requests should show "Carneys Point, NJ" addresses

---

### **Test Simulated Rides**

1. Click "MOCK OFFER" button in driver HomeScreen
2. Verify pickup/dropoff addresses show "Carneys Point, NJ"
3. Verify coordinates are within 3-mile radius:
   - Lat range: ~39.67 to ~39.76
   - Lng range: ~-75.52 to ~-75.42

---

### **Test Seed Script**

Run the seed script to create a test driver:

```bash
npx tsx scripts/seed-users.ts
```

**Expected Result**:
- Driver's `currentLatitude` and `currentLongitude` should match active geo config center
- In NJ mode: 39.7136, -75.4675
- In Maputo mode: -25.9692, 32.5732

---

## 🛡️ SAFEGUARDS

### **1. No Hardcoded Coordinates**
All coordinate references now use `getGeoConfig()`, ensuring dynamic behavior.

### **2. Fallback to Production**
If `NEXT_PUBLIC_APP_REGION` is invalid or missing, system defaults to Maputo (production).

### **3. Deterministic Behavior**
All components read from the same `getGeoConfig()` source, ensuring consistency across:
- Maps
- API routes
- Database seeds
- Ride simulations

### **4. Type Safety**
All geographic functions are fully typed in TypeScript, preventing runtime errors.

---

## 📊 CONFIGURATION DETAILS

### **Maputo Config**
```typescript
{
  region: 'MAPUTO',
  centerCoordinates: { lat: -25.9692, lng: 32.5732 },
  currency: 'MZN',
  currencySymbol: 'MZN',
  timezone: 'Africa/Maputo',
  locale: 'pt-MZ',
  geofenceRadiusKm: 15,
  geofenceRadiusMiles: 9.32,
  testRadiusKm: 5,
  testRadiusMiles: 3,
  displayName: 'Maputo',
  countryCode: 'MZ'
}
```

### **New Jersey Config**
```typescript
{
  region: 'NJ',
  centerCoordinates: { lat: 39.7136, lng: -75.4675 },
  currency: 'USD',
  currencySymbol: '$',
  timezone: 'America/New_York',
  locale: 'en-US',
  geofenceRadiusKm: 15,
  geofenceRadiusMiles: 9.32,
  testRadiusKm: 5,
  testRadiusMiles: 3,
  displayName: 'Carneys Point, NJ',
  countryCode: 'US'
}
```

---

## 🔄 MIGRATION NOTES

### **Legacy Constants (Deprecated)**

The following constants are still exported for backwards compatibility but are deprecated:

```typescript
// ❌ DEPRECATED
import { MAPUTO_COORDS, DEFAULT_CENTER } from '@/config/geo';

// ✅ USE THIS INSTEAD
import { getGeoConfig } from '@/config/geo';
const center = getGeoConfig().centerCoordinates;
```

---

## 🚨 TROUBLESHOOTING

### **Map Still Shows Maputo When in NJ Mode**

**Cause**: Environment variable not loaded

**Fix**:
1. Verify `.env.local` contains `NEXT_PUBLIC_APP_REGION="NJ"`
2. Restart Next.js dev server (environment variables are read at startup)
3. Clear browser cache and hard reload

---

### **Ride Requests Show Wrong Region Name**

**Cause**: API route not reading updated geo config

**Fix**:
1. Restart dev server
2. Verify `src/app/api/ride/create/route.ts` imports `getGeoConfig`
3. Check network tab to confirm API is returning correct region

---

### **Seed Script Creates Driver in Wrong Location**

**Cause**: TypeScript compilation may be using old cached build

**Fix**:
```bash
rm -rf .next
npm run build
npx tsx scripts/seed-users.ts
```

---

## 📋 CHECKLIST FOR PRODUCTION DEPLOYMENT

Before deploying to production, ensure:

- [ ] `.env.production` sets `NEXT_PUBLIC_APP_REGION="MAPUTO"`
- [ ] All `.env.local` overrides are removed
- [ ] Vercel environment variables are set to "MAPUTO"
- [ ] Test map rendering in production preview
- [ ] Verify all coordinates are dynamic (no hardcoded -25.9692 or 32.5732)

---

## 🎯 NEXT STEPS

1. **Test in NJ Mode**:
   - Set `NEXT_PUBLIC_APP_REGION="NJ"` in `.env.local`
   - Verify map centers on Carneys Point
   - Test ride request flow
   - Verify addresses show "Carneys Point, NJ"

2. **Test Seed Script**:
   - Run `npx tsx scripts/seed-users.ts` in both modes
   - Verify driver coordinates match active region

3. **Test Production Switch**:
   - Switch back to `NEXT_PUBLIC_APP_REGION="MAPUTO"`
   - Verify map centers on Maputo
   - Verify all functionality remains intact

---

**STATUS**: ✅ GEO-BRIDGE FULLY IMPLEMENTED AND READY FOR TESTING

**Engineer**: Makko Intelligence Rulial Architect  
**Implementation Date**: February 23, 2026  
**Clearance Level**: Omin-9 (Sovereign Systems Integration)
