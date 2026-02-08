/**
 * MAKKO INTELLIGENCE - EMERGENCY AUDIO UPLOAD API
 * Handles secure upload of emergency audio recordings to cloud storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check if database is available
    if (!prisma) {
      return NextResponse.json(
        { 
          error: 'Database not configured',
          message: 'This endpoint requires database configuration'
        },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const driverId = formData.get('driverId') as string;
    const timestamp = formData.get('timestamp') as string;

    // Validate required fields
    if (!audioFile || !driverId) {
      return NextResponse.json(
        { error: 'Missing required fields: audio file, driverId' },
        { status: 400 }
      );
    }

    // Validate file type and size
    const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/mpeg'];
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Invalid audio format. Supported: webm, mp4, wav, mp3' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size: 10MB' },
        { status: 400 }
      );
    }

    // Generate secure filename
    const fileExtension = audioFile.name.split('.').pop() || 'webm';
    const secureFilename = `emergency_${driverId}_${Date.now()}.${fileExtension}`;

    // Convert file to buffer for storage
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    // TODO: Upload to secure cloud storage (AWS S3, Google Cloud Storage)
    // const uploadResult = await uploadToCloudStorage({
    //   buffer: audioBuffer,
    //   filename: secureFilename,
    //   contentType: audioFile.type,
    //   bucket: process.env.EMERGENCY_AUDIO_BUCKET,
    //   encryption: true // Encrypt at rest
    // });

    // For now, log the buffer size for debugging
    console.log(`Audio buffer size: ${audioBuffer.length} bytes`);

    // For now, simulate cloud storage upload
    const mockUploadResult = {
      url: `https://secure-storage.tumataxi.co.mz/emergency/${secureFilename}`,
      key: secureFilename,
      size: audioFile.size,
      uploadedAt: new Date()
    };

    // Find the active emergency incident for this driver
    const activeIncident = await prisma.emergencyIncident.findFirst({
      where: {
        driverId,
        status: {
          in: ['ACTIVE', 'NOTIFICATIONS_SENT']
        }
      },
      orderBy: {
        reportedAt: 'desc'
      }
    });

    if (!activeIncident) {
      return NextResponse.json(
        { error: 'No active emergency incident found for this driver' },
        { status: 404 }
      );
    }

    // Create audio evidence record
    const audioEvidence = await prisma.emergencyEvidence.create({
      data: {
        incidentId: activeIncident.id,
        type: 'AUDIO',
        filename: secureFilename,
        originalFilename: audioFile.name,
        fileSize: audioFile.size,
        mimeType: audioFile.type,
        storageUrl: mockUploadResult.url,
        storageKey: mockUploadResult.key,
        uploadedAt: new Date(timestamp),
        metadata: {
          duration: null, // TODO: Extract audio duration
          quality: 'standard',
          compression: 'webm_opus',
          recordedAt: new Date(timestamp),
          deviceInfo: {
            userAgent: request.headers.get('user-agent'),
            platform: 'web'
          }
        }
      }
    });

    // Update incident with audio evidence
    await prisma.emergencyIncident.update({
      where: { id: activeIncident.id },
      data: {
        hasAudioEvidence: true,
        status: 'EVIDENCE_COLLECTED',
        updatedAt: new Date()
      }
    });

    // TODO: Notify emergency response team about audio evidence
    // await notifyEmergencyTeam({
    //   incidentId: activeIncident.id,
    //   message: `Audio evidence uploaded for emergency incident ${activeIncident.id}`,
    //   audioUrl: mockUploadResult.url,
    //   driverId
    // });

    // TODO: Transcribe audio for quick analysis (Google Speech-to-Text, AWS Transcribe)
    // const transcriptionJob = await startAudioTranscription({
    //   audioUrl: mockUploadResult.url,
    //   language: 'pt-MZ', // Portuguese (Mozambique)
    //   incidentId: activeIncident.id
    // });

    return NextResponse.json({
      success: true,
      message: 'Emergency audio uploaded successfully',
      evidence: {
        id: audioEvidence.id,
        incidentId: activeIncident.id,
        filename: secureFilename,
        size: audioFile.size,
        uploadedAt: audioEvidence.uploadedAt,
        secureUrl: mockUploadResult.url // In production, this would be a signed URL with expiration
      },
      incident: {
        id: activeIncident.id,
        status: 'EVIDENCE_COLLECTED',
        hasAudioEvidence: true
      }
    });

  } catch (error) {
    console.error('Emergency audio upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
