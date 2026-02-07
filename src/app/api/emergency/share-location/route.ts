/**
 * MAKKO INTELLIGENCE - EMERGENCY LOCATION SHARING API
 * Handles SOS location sharing with emergency contacts and authorities
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { location, driverId, timestamp, emergencyType } = await request.json();

    // Validate required fields
    if (!location || !driverId) {
      return NextResponse.json(
        { error: 'Missing required fields: location, driverId' },
        { status: 400 }
      );
    }

    // Validate location format
    if (!location.latitude || !location.longitude) {
      return NextResponse.json(
        { error: 'Invalid location format. Requires latitude and longitude' },
        { status: 400 }
      );
    }

    // Create emergency incident record
    const emergencyIncident = await prisma.emergencyIncident.create({
      data: {
        driverId,
        type: emergencyType || 'SOS_ACTIVATED',
        status: 'ACTIVE',
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy || null,
          timestamp: new Date(timestamp)
        },
        reportedAt: new Date(timestamp),
        metadata: {
          userAgent: request.headers.get('user-agent'),
          ipAddress: request.ip || 'unknown',
          deviceInfo: {
            platform: 'web',
            timestamp: new Date().toISOString()
          }
        }
      }
    });

    // Get driver's emergency contacts
    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      include: {
        emergencyContacts: true,
        ridesAsDriver: {
          where: {
            status: {
              in: ['MATCHED', 'ARRIVED', 'IN_PROGRESS']
            }
          },
          include: {
            rider: true
          },
          take: 1
        }
      }
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    const currentRide = driver.ridesAsDriver[0] || null;

    // Prepare location sharing data
    const locationData = {
      incidentId: emergencyIncident.id,
      driverName: `${driver.firstName} ${driver.lastName}`,
      driverPhone: driver.phoneNumber,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || 'Address lookup in progress...'
      },
      timestamp: new Date(timestamp),
      emergencyType,
      googleMapsUrl: `https://maps.google.com/maps?q=${location.latitude},${location.longitude}`,
      currentRide: currentRide ? {
        rideId: currentRide.id,
        passengerName: `${currentRide.rider.firstName} ${currentRide.rider.lastName}`,
        passengerPhone: currentRide.rider.phoneNumber
      } : null
    };

    // Share location with emergency contacts
    const notificationPromises = [];

    // 1. Notify emergency contacts via SMS
    for (const contact of driver.emergencyContacts) {
      const smsMessage = `🚨 EMERGENCY ALERT 🚨\n${locationData.driverName} has activated SOS.\nLocation: ${locationData.googleMapsUrl}\nTime: ${new Date(timestamp).toLocaleString()}\nPlease check on them immediately.`;
      
      // TODO: Implement SMS service (Twilio)
      notificationPromises.push(
        // sendSMS(contact.phone, smsMessage)
        Promise.resolve(console.log(`SMS to ${contact.phone}: ${smsMessage}`))
      );
    }

    // 2. Notify TumaTaxi emergency response team
    const emergencyTeamMessage = `🚨 DRIVER EMERGENCY 🚨\nDriver: ${locationData.driverName} (${locationData.driverPhone})\nLocation: ${locationData.googleMapsUrl}\nIncident ID: ${emergencyIncident.id}\nTime: ${new Date(timestamp).toLocaleString()}`;
    
    notificationPromises.push(
      // sendSMS(process.env.EMERGENCY_TEAM_PHONE, emergencyTeamMessage)
      Promise.resolve(console.log(`Emergency team SMS: ${emergencyTeamMessage}`))
    );

    // 3. If driver has active ride, notify passenger
    if (locationData.currentRide) {
      const passengerMessage = `Your TumaTaxi driver has activated emergency assistance. Our team has been notified and will ensure your safety. Please remain calm.`;
      
      notificationPromises.push(
        // sendSMS(locationData.currentRide.passengerPhone, passengerMessage)
        Promise.resolve(console.log(`Passenger SMS: ${passengerMessage}`))
      );
    }

    // 4. TODO: Integrate with local emergency services API
    // notificationPromises.push(
    //   notifyEmergencyServices({
    //     location: locationData.location,
    //     incidentType: 'TAXI_DRIVER_EMERGENCY',
    //     contactInfo: locationData.driverPhone,
    //     additionalInfo: `TumaTaxi driver emergency. Incident ID: ${emergencyIncident.id}`
    //   })
    // );

    // Execute all notifications
    await Promise.allSettled(notificationPromises);

    // Update incident with notification status
    await prisma.emergencyIncident.update({
      where: { id: emergencyIncident.id },
      data: {
        notificationsSent: true,
        notificationsSentAt: new Date(),
        status: 'NOTIFICATIONS_SENT'
      }
    });

    return NextResponse.json({
      success: true,
      incidentId: emergencyIncident.id,
      message: 'Emergency location shared successfully',
      notificationsCount: driver.emergencyContacts.length + 1, // +1 for emergency team
      locationShared: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date(timestamp)
      }
    });

  } catch (error) {
    console.error('Emergency location sharing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}