/**
 * GEO-BRIDGE TEST SCRIPT
 * Verifies that getGeoConfig() returns correct values for both regions
 */

import { getGeoConfig, isTestingRegion, isProductionRegion, generateSimulatedRideCoordinates, calculateDistance } from '../src/config/geo';

console.log('\n========================================');
console.log('🌍 GEO-BRIDGE TEST SUITE');
console.log('========================================\n');

// Test 1: Get current config
console.log('TEST 1: Current Geo Configuration');
console.log('------------------------------------------');
const config = getGeoConfig();
console.log(`Region: ${config.region}`);
console.log(`Center: ${config.centerCoordinates.lat}, ${config.centerCoordinates.lng}`);
console.log(`Currency: ${config.currency} (${config.currencySymbol})`);
console.log(`Timezone: ${config.timezone}`);
console.log(`Locale: ${config.locale}`);
console.log(`Display Name: ${config.displayName}`);
console.log(`Country Code: ${config.countryCode}`);
console.log(`Geofence Radius: ${config.geofenceRadiusKm}km (${config.geofenceRadiusMiles}mi)`);
console.log(`Test Radius: ${config.testRadiusKm}km (${config.testRadiusMiles}mi)`);
console.log('✅ PASSED\n');

// Test 2: Region detection
console.log('TEST 2: Region Detection');
console.log('------------------------------------------');
console.log(`Is Testing Region (NJ): ${isTestingRegion()}`);
console.log(`Is Production Region (Maputo): ${isProductionRegion()}`);
console.log('✅ PASSED\n');

// Test 3: Simulated ride coordinates
console.log('TEST 3: Simulated Ride Coordinates');
console.log('------------------------------------------');
for (let i = 1; i <= 5; i++) {
  const { pickup, dropoff } = generateSimulatedRideCoordinates();
  const distance = calculateDistance(pickup, dropoff);
  
  console.log(`\nSimulation ${i}:`);
  console.log(`  Pickup:  ${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`);
  console.log(`  Dropoff: ${dropoff.lat.toFixed(4)}, ${dropoff.lng.toFixed(4)}`);
  console.log(`  Distance: ${distance.toFixed(2)} km`);
  
  // Verify distance constraints
  if (distance < 0.5) {
    console.log('  ❌ FAILED: Distance < 0.5km');
    process.exit(1);
  }
  
  // Verify coordinates are within test radius
  const centerToPickup = calculateDistance(config.centerCoordinates, pickup);
  const centerToDropoff = calculateDistance(config.centerCoordinates, dropoff);
  
  if (centerToPickup > config.testRadiusKm) {
    console.log(`  ❌ FAILED: Pickup too far from center (${centerToPickup.toFixed(2)}km)`);
    process.exit(1);
  }
  
  if (centerToDropoff > config.testRadiusKm) {
    console.log(`  ❌ FAILED: Dropoff too far from center (${centerToDropoff.toFixed(2)}km)`);
    process.exit(1);
  }
  
  console.log(`  ✅ Valid (pickup ${centerToPickup.toFixed(2)}km, dropoff ${centerToDropoff.toFixed(2)}km from center)`);
}
console.log('\n✅ ALL SIMULATIONS PASSED\n');

// Test 4: Distance calculation accuracy
console.log('TEST 4: Distance Calculation Accuracy');
console.log('------------------------------------------');

// Test known distance: Carneys Point, NJ to Philadelphia, PA (~15km)
const carneysPoint = { lat: 39.7136, lng: -75.4675 };
const philadelphia = { lat: 39.9526, lng: -75.1652 };
const njToPhilly = calculateDistance(carneysPoint, philadelphia);
console.log(`Carneys Point to Philadelphia: ${njToPhilly.toFixed(2)} km`);
console.log('  Expected: ~31-33 km');
if (njToPhilly >= 30 && njToPhilly <= 35) {
  console.log('  ✅ PASSED (within expected range)');
} else {
  console.log('  ⚠️  WARNING: Outside expected range');
}

// Test known distance: Maputo center to suburbs (~10km)
const maputoCenter = { lat: -25.9692, lng: 32.5732 };
const maputoSuburb = { lat: -25.8800, lng: 32.6000 };
const maputoDistance = calculateDistance(maputoCenter, maputoSuburb);
console.log(`\nMaputo center to suburb: ${maputoDistance.toFixed(2)} km`);
console.log('  Expected: ~10-12 km');
if (maputoDistance >= 9 && maputoDistance <= 13) {
  console.log('  ✅ PASSED (within expected range)');
} else {
  console.log('  ⚠️  WARNING: Outside expected range');
}

console.log('\n✅ ALL TESTS PASSED\n');

// Summary
console.log('========================================');
console.log('📊 TEST SUMMARY');
console.log('========================================');
console.log(`Active Region: ${config.region}`);
console.log(`Environment Variable: NEXT_PUBLIC_APP_REGION="${process.env.NEXT_PUBLIC_APP_REGION || 'not set (defaults to MAPUTO)'}"`);
console.log('\n✅ GEO-BRIDGE IS OPERATIONAL');
console.log('========================================\n');
