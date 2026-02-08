/**
 * MAKKO INTELLIGENCE - Seed Users Script
 * Creates 1 Dummy Driver (Online) + 1 Dummy Passenger for testing
 * Run: npx tsx scripts/seed-users.ts
 */
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

const DRIVER_EMAIL = 'driver@tumataxi.dev';
const DRIVER_PASSWORD = 'Driver123!';
const PASSENGER_EMAIL = 'passenger@tumataxi.dev';
const PASSENGER_PASSWORD = 'Passenger123!';

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  // Service role key required for admin.createUser
  const supabase = createClient(supabaseUrl, supabaseServiceKey ?? supabaseAnonKey, {
    auth: { persistSession: false },
  });

  let driverAuthId = 'seed-driver-' + Date.now();
  let passengerAuthId = 'seed-passenger-' + Date.now();

  if (supabaseServiceKey) {
    // Create Driver in Supabase Auth
    const { data: driverAuth, error: driverAuthError } = await supabase.auth.admin.createUser({
    email: DRIVER_EMAIL,
    password: DRIVER_PASSWORD,
    email_confirm: true,
    user_metadata: { role: 'DRIVER', first_name: 'João', last_name: 'Driver' },
  });

  if (driverAuthError && driverAuthError.message?.includes('already been registered')) {
    console.log('Driver already exists in Supabase Auth');
  } else if (driverAuthError) {
    console.error('Driver Supabase Auth error:', driverAuthError);
  } else if (driverAuth?.user?.id) {
    driverAuthId = driverAuth.user.id;
  }

    // Create Passenger in Supabase Auth
    const { data: passengerAuth, error: passengerAuthError } = await supabase.auth.admin.createUser({
    email: PASSENGER_EMAIL,
    password: PASSENGER_PASSWORD,
    email_confirm: true,
    user_metadata: { role: 'PASSENGER', first_name: 'Maria', last_name: 'Passenger' },
  });

  if (passengerAuthError && passengerAuthError.message?.includes('already been registered')) {
    console.log('Passenger already exists in Supabase Auth');
  } else if (passengerAuthError) {
    console.error('Passenger Supabase Auth error:', passengerAuthError);
  } else if (passengerAuth?.user?.id) {
    passengerAuthId = passengerAuth.user.id;
  }
  } else {
    console.log('TIP: Set SUPABASE_SERVICE_ROLE_KEY to create auth users. Run: npm run seed');
    console.log('For now, sign up manually at /signup for driver and passenger.');
    return;
  }

  // Create User + DriverProfile in Prisma
  const driver = await prisma.user.upsert({
    where: { email: DRIVER_EMAIL },
    update: {},
    create: {
      authId: driverAuthId,
      email: DRIVER_EMAIL,
      firstName: 'João',
      lastName: 'Driver',
      phoneNumber: '+258841234567',
      role: 'DRIVER',
      emailVerified: true,
    },
  });

  await prisma.driverProfile.upsert({
    where: { userId: driver.id },
    update: {
      verificationStatus: 'APPROVED',
      isOnline: true,
      currentLatitude: -25.9692,
      currentLongitude: 32.5732,
      lastLocationUpdate: new Date(),
      vehicleMake: 'Toyota',
      vehicleModel: 'Corolla',
      vehicleYear: 2022,
      licensePlate: 'AA-123-XY',
      vehicleColor: 'Black',
      vehicleType: 'TAXI',
    },
    create: {
      userId: driver.id,
      verificationStatus: 'APPROVED',
      isOnline: true,
      currentLatitude: -25.9692,
      currentLongitude: 32.5732,
      lastLocationUpdate: new Date(),
      vehicleMake: 'Toyota',
      vehicleModel: 'Corolla',
      vehicleYear: 2022,
      licensePlate: 'AA-123-XY',
      vehicleColor: 'Black',
      vehicleType: 'TAXI',
    },
  });

  await prisma.user.upsert({
    where: { email: PASSENGER_EMAIL },
    update: {},
    create: {
      authId: passengerAuthId,
      email: PASSENGER_EMAIL,
      firstName: 'Maria',
      lastName: 'Passenger',
      phoneNumber: '+258842345678',
      role: 'PASSENGER',
      emailVerified: true,
    },
  });

  console.log('');
  console.log('✅ Seed complete!');
  console.log('');
  console.log('DRIVER (Online):');
  console.log('  Email:', DRIVER_EMAIL);
  console.log('  Password:', DRIVER_PASSWORD);
  console.log('  → /driver/dashboard');
  console.log('');
  console.log('PASSENGER:');
  console.log('  Email:', PASSENGER_EMAIL);
  console.log('  Password:', PASSENGER_PASSWORD);
  console.log('  → /ride/map');
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
