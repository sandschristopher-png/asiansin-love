'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Camera, RefreshCw, X, ShieldCheck, AlertCircle } from 'lucide-react';

export type VerificationPose = 'peace' | 'chin' | 'palm' | 'three';

interface PoseMetadata {
  id: VerificationPose;
  label: string;
  instruction: string;
  imageSrc: string;
}

const POSES: Record<VerificationPose, PoseMetadata> = {
  peace: {
    id: 'peace',
    label: 'Peace Sign Beside Cheek',
    instruction: 'Hold up two fingers in a V sign right beside your cheek or temple.',
    imageSrc: '/images/verification/pose-peace.png',
  },
  chin: {
    id: 'chin',
    label: 'Finger on Chin',
    instruction: 'Rest your index finger under your chin while looking directly into the camera.',
    imageSrc: '/images/verification/pose-chin.png',
  },
  palm: {
    id: 'palm',
    label: 'Open Palm Facing Forward',
    instruction: 'Hold up an open palm facing forward next to your ear.',
    imageSrc: '/images/verification/pose-palm.png',
  },
  three: {
    id: 'three',
    label: 'Three Fingers Up',
    instruction: 'Hold up three fingers (index, middle, ring) upright beside your face.',
    imageSrc: '/images/verification/pose-three.png',
  },
};

const POSE_KEYS: VerificationPose[] = ['peace', 'chin', 'palm', 'three'];

interface GestureVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function GestureVerifyModal({ isOpen, onClose, onSuccess }: GestureVerifyModalProps) {
  const [currentPose, setCurrentPose] = useState<PoseMetadata>(POSES.peace);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'approved' | 'denied'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pick a random pose on open
  useEffect(() => {
    if (isOpen) {
      const randomPose = POSE_KEYS[Math.floor(Math.random() * POSE_KEYS.length)];
      setCurrentPose(POSES[randomPose]);
      setCapturedBlob(null);
      setPreviewUrl(null);
      setStatus('idle');
      setStatusMessage('');
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in your browser to verify.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Live camera is required for verification.');
      } else {
        setCameraError('Unable to open camera stream. Please check browser permissions.');
      }
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [stopCamera, previewUrl]);

  // Capture frame directly from WebRTC video stream (Zero File Upload)
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally to mirror the natural camera reflection
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
        }
      },
      'image/jpeg',
      0.92
    );
  };

  const retakePhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setCapturedBlob(null);
    setPreviewUrl(null);
    setStatus('idle');
    setStatusMessage('');
  };

  const submitVerification = async () => {
    if (!capturedBlob) return;

    setStatus('submitting');
    try {
      const formData = new FormData();
      formData.append('photo', capturedBlob, 'verification.jpg');
      formData.append('pose', currentPose.id);

      const res = await fetch('/api/verify', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setStatus('approved');
        setStatusMessage(data.message || 'Pose confirmed! Your profile is now verified.');
        stopCamera();
        if (onSuccess) {
          setTimeout(onSuccess, 1800);
        }
      } else {
        setStatus('denied');
        setStatusMessage(data.error || 'The gesture could not be matched. Please match the pose illustration and try again.');
      }
    } catch {
      setStatus('denied');
      setStatusMessage('Verification request failed. Please check your connection and retry.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#DDD7E5] shadow-2xl overflow-hidden p-5 space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EDF5]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#6555B8]" />
            <h2 className="text-sm font-bold text-[#1C1924]">Member Pose Verification</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#8C849B] hover:text-[#1C1924] rounded-full hover:bg-[#FAF8FD] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status: Approved View */}
        {status === 'approved' ? (
          <div className="py-6 text-center space-y-4">
            <div className="relative w-36 h-36 mx-auto rounded-2xl overflow-hidden border border-[#DDD7E5] bg-white shadow-xs">
              <Image
                src="/images/verification/status-approved.png"
                alt="Verification Approved"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#1C1924]">Verification Complete</h3>
              <p className="text-xs text-[#524B5E] max-w-xs mx-auto">{statusMessage}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-[#6555B8] text-white text-xs font-bold hover:bg-[#53449E] transition"
            >
              Done
            </button>
          </div>
        ) : status === 'denied' ? (
          /* Status: Denied View */
          <div className="py-6 text-center space-y-4">
            <div className="relative w-36 h-36 mx-auto rounded-2xl overflow-hidden border border-[#E05375]/30 bg-white shadow-xs">
              <Image
                src="/images/verification/status-denied.png"
                alt="Verification Denied"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#1C1924]">Pose Not Recognized</h3>
              <p className="text-xs text-[#524B5E] max-w-xs mx-auto">{statusMessage}</p>
            </div>
            <button
              type="button"
              onClick={retakePhoto}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#6555B8] text-white text-xs font-bold hover:bg-[#53449E] transition"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        ) : (
          /* Active Verification Flow */
          <>
            {/* Pose Instruction Card */}
            <div className="flex items-center gap-3 bg-[#FAF8FD] border border-[#DDD7E5] rounded-2xl p-3">
              <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-white border border-[#DDD7E5]">
                <Image
                  src={currentPose.imageSrc}
                  alt={currentPose.label}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="space-y-1 text-left">
                <span className="inline-block bg-[#6555B8] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Required Pose
                </span>
                <p className="text-xs font-bold text-[#1C1924]">{currentPose.label}</p>
                <p className="text-[11px] text-[#524B5E] leading-snug">{currentPose.instruction}</p>
              </div>
            </div>

            {/* Camera Viewport / Photo Snapshot */}
            <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-[#DDD7E5]">
              {cameraError ? (
                <div className="p-6 text-center text-white space-y-3">
                  <AlertCircle className="w-8 h-8 text-[#E05375] mx-auto" />
                  <p className="text-xs text-gray-200">{cameraError}</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-[#6555B8] text-white text-xs font-bold rounded-xl"
                  >
                    Retry Camera
                  </button>
                </div>
              ) : capturedBlob && previewUrl ? (
                <img src={previewUrl} alt="Captured verification" className="w-full h-full object-cover" />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-white/40 rounded-2xl pointer-events-none m-3 flex items-center justify-center">
                    <span className="text-[11px] text-white/90 bg-black/50 px-3 py-1 rounded-full backdrop-blur-xs">
                      Align head & match gesture
                    </span>
                  </div>
                </>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {/* Action Buttons */}
            <div className="pt-1">
              {capturedBlob ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={retakePhoto}
                    disabled={status === 'submitting'}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl border border-[#DDD7E5] text-xs font-bold text-[#524B5E] hover:bg-[#FAF8FD] transition disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={submitVerification}
                    disabled={status === 'submitting'}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#6555B8] text-white text-xs font-bold hover:bg-[#53449E] transition disabled:opacity-50"
                  >
                    {status === 'submitting' ? 'Verifying...' : 'Submit Verification'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={takePhoto}
                  disabled={Boolean(cameraError)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#6555B8] text-white text-xs font-bold hover:bg-[#53449E] transition shadow-md disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  Take Photo Now
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
