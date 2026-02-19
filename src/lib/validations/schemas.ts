/**
 * MAKKO RULIAL — API request validation (Pillar 2: Infrastructure Vault)
 * Strict schemas for all mutable API bodies. Use with parseOr400 helper.
 */
import { z } from 'zod';

export const rideCreateSchema = z.object({
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropLat: z.number().optional(),
  dropLng: z.number().optional(),
  price: z.number().min(0).optional(),
  vehicleType: z.string().optional(),
  pickupAddress: z.string().optional(),
  dropoffAddress: z.string().optional(),
});
export type RideCreateBody = z.infer<typeof rideCreateSchema>;

export const driverOnboardingSchema = z.object({
  authId: z.string().min(1, 'authId required'),
  email: z.string().email(),
  firstName: z.string().min(1, 'firstName required'),
  lastName: z.string().min(1, 'lastName required'),
  phone: z.string().optional(),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.number().optional(),
  licensePlate: z.string().optional(),
  vehicleColor: z.string().optional(),
  vehicleType: z.string().optional(),
  licenseFrontUrl: z.string().optional(),
  licenseBackUrl: z.string().optional(),
  insuranceUrl: z.string().optional(),
  vehicleRegistrationUrl: z.string().optional(),
});
export type DriverOnboardingBody = z.infer<typeof driverOnboardingSchema>;

export const goOnlineSchema = z.object({
  authId: z.string().min(1, 'authId required'),
  isOnline: z.boolean(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});
export type GoOnlineBody = z.infer<typeof goOnlineSchema>;

export const rideAcceptSchema = z.object({
  rideId: z.string().min(1, 'rideId required'),
  driverId: z.string().min(1, 'driverId required'),
  acceptedAt: z.string().optional(),
});
export type RideAcceptBody = z.infer<typeof rideAcceptSchema>;

export const rideDeclineSchema = z.object({
  rideId: z.string().min(1, 'rideId required'),
  driverId: z.string().min(1, 'driverId required'),
  reason: z.string().optional(),
  declinedAt: z.string().optional(),
});
export type RideDeclineBody = z.infer<typeof rideDeclineSchema>;
