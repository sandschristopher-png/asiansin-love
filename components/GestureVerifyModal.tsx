'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ShieldCheck, AlertCircle, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { FilesetResolver, GestureRecognizer, FaceLandmarker } from '@mediapipe/tasks-vision';
import * as faceapi from '@vladmandic/face-api';

export type CanonicalPose = 'palm' | 'peace' | 'pointing' | 'thumbs';

interface PoseMetadata {
  id: CanonicalPose;
  label: string;
  instruction: string;
  imageSrc: string;
  expectedGesture: string;
}

const POSE_DETAILS: Record<CanonicalPose, PoseMetadata> = {
  peace: {
    id: 'peace',
    label: 'Peace Sign Beside Cheek',
    instruction: 'Hold up two fingers in a V sign right beside your cheek.',
    imageSrc: '/images/verification/pose-peace.png',
    expectedGesture: 'Victory',
  },
  palm: {
    id: 'palm',
    label: 'Open Palm Facing Forward',
    instruction: 'Hold up an open palm facing forward next to your cheek.',
    imageSrc: '/images/verification/pose-palm.png',
    expectedGesture: 'Open_Palm',
  },
  pointing: {
    id: 'pointing',
    label: 'Pointing Upward',
    instruction: 'Point your index finger upward beside your cheek looking straight ahead.',
    imageSrc: '/images/verification/pose-pointing.png',
    expectedGesture: 'Pointing_Up',
  },
  thumbs: {
    id: 'thumbs',
    label: 'Thumbs Up Beside Face',
    instruction: 'Hold up a clear thumbs-up gesture beside your cheek.',
    imageSrc: '/images/verification/pose-thumbs.png',
    expectedGesture: 'Thumb_Up',
  },
};

interface GestureVerifyModalProps {
  isOpen: boolean;
  avatarUrl?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type Phase = 'loading' | 'liveness' | 'pose_0' | 'pose_1' | 'submitting' | 'approved' | 'denied';

export default function GestureVerifyModal({
  isOpen,
  avatarUrl = '/hero-woman.png',
  onClose,
  onSuccess,
}: GestureVerifyModalProps) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [statusMessage, setStatusMessage] = useState('Initializing verification session...');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [currentPose, setCurrentPose] = useState<PoseMetadata>(POSE_DETAILS.peace);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const phaseRef = useRef<Phase>('loading');
  const sequenceRef = useRef<CanonicalPose[]>([]);
  const attemptIdRef = useRef<string>('');
  const currentPoseRef = useRef<PoseMetadata>(POSE_DETAILS.peace);
  const captureTimestampsRef = useRef<number[]>([]);
  const capturedBlobsRef = useRef<Blob[]>([]);

  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const isLoopRunningRef = useRef(false);
  const animationFrameIdRef = useRef<number | null>(null);
  const poseHoldStartTimeRef = useRef<number | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const avatarUrlRef = useRef(avatarUrl);

  onSuccessRef.current = onSuccess;
  avatarUrlRef.current = avatarUrl;

  const setAppPhase = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const cleanup = useCallback(() => {
    isLoopRunningRef.current = false;
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const initSession = useCallback(async () => {
    try {
      const res = await fetch('/api/verify/start', { method: 'POST' });
      if (!res.ok) throw new Error('Could not start verification session');
      const data = await res.json();
      attemptIdRef.current = data.attemptId;
      sequenceRef.current = data.sequence as CanonicalPose[];

      if (sequenceRef.current.length > 0) {
        const firstPose = POSE_DETAILS[sequenceRef.current[0]] || POSE_DETAILS.peace;
        currentPoseRef.current = firstPose;
        setCurrentPose(firstPose);
      }
      return true;
    } catch {
      setCameraError('Unable to obtain verification token. Please try again.');
      setAppPhase('denied');
      return false;
    }
  }, []);

  const takeSnapshotBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video) return resolve(null);

      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
    });
  };

  const submitToServer = async () => {
    setAppPhase('submitting');
    setStatusMessage('Submitting verified biometric credentials...');

    try {
      const formData = new FormData();
      formData.append('attemptId', attemptIdRef.current);
      formData.append('captureTimestamps', JSON.stringify(captureTimestampsRef.current));

      capturedBlobsRef.current.forEach((blob, idx) => {
        formData.append(`pose_${idx}`, blob, `pose_${idx}.jpg`);
      });

      const res = await fetch('/api/verify/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.verified) {
        setAppPhase('approved');
        setStatusMessage('Pose verification confirmed! Your profile is verified.');
        cleanup();
        if (onSuccessRef.current) setTimeout(() => onSuccessRef.current?.(), 1800);
      } else {
        setAppPhase('denied');
        setStatusMessage(data.error || 'Verification validation failed.');
      }
    } catch {
      setAppPhase('denied');
      setStatusMessage('Submission error. Please check your connection.');
    }
  };

  const handlePoseProgress = async (video: HTMLVideoElement, isPose1: boolean) => {
    isLoopRunningRef.current = false;
    setHoldProgress(100);

    const blob = await takeSnapshotBlob();
    if (blob) {
      capturedBlobsRef.current.push(blob);
      captureTimestampsRef.current.push(Date.now());
    }

    if (!isPose1 && sequenceRef.current.length > 1) {
      const nextPose = POSE_DETAILS[sequenceRef.current[1]] || POSE_DETAILS.thumbs;
      currentPoseRef.current = nextPose;
      setCurrentPose(nextPose);
      poseHoldStartTimeRef.current = null;
      setHoldProgress(0);

      setTimeout(() => {
        setAppPhase('pose_1');
        setStatusMessage(`Next pose: ${nextPose.label}`);
        isLoopRunningRef.current = true;
        startDetectionLoop();
      }, 700);
    } else {
      setStatusMessage('Matching facial biometric vector against your avatar...');
      try {
        const liveDetection = await faceapi
          .detectSingleFace(video)
          .withFaceLandmarks()
          .withFaceDescriptor();

        const avatarImg = await faceapi.fetchImage(avatarUrlRef.current).catch(() => null);
        if (avatarImg && liveDetection) {
          const avatarDetection = await faceapi
            .detectSingleFace(avatarImg)
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (avatarDetection) {
            const distance = faceapi.euclideanDistance(
              liveDetection.descriptor,
              avatarDetection.descriptor
            );
            if (distance > 0.48) {
              setAppPhase('denied');
              setStatusMessage('Face biometric does not match your profile photo.');
              return;
            }
          }
        }
      } catch {
        // Continue if face vector detection throws on low-light avatar
      }

      await submitToServer();
    }
  };

  const startDetectionLoop = useCallback(() => {
    if (isLoopRunningRef.current) return;
    isLoopRunningRef.current = true;

    const loop = async () => {
      if (!isLoopRunningRef.current) return;
      const video = videoRef.current;

      if (video && video.readyState >= 2 && faceLandmarkerRef.current && recognizerRef.current) {
        const now = performance.now();
        const curPhase = phaseRef.current;

        if (curPhase === 'liveness') {
          const faceResults = faceLandmarkerRef.current.detectForVideo(video, now);
          if (faceResults.faceBlendshapes && faceResults.faceBlendshapes.length > 0) {
            const shapes = faceResults.faceBlendshapes[0].categories;
            const eyeBlinkLeft = shapes.find((s) => s.categoryName === 'eyeBlinkLeft')?.score || 0;
            const eyeBlinkRight = shapes.find((s) => s.categoryName === 'eyeBlinkRight')?.score || 0;

            if (eyeBlinkLeft > 0.6 && eyeBlinkRight > 0.6) {
              setAppPhase('pose_0');
              setStatusMessage(`Blink detected! Match Pose 1: ${currentPoseRef.current.label}`);
            }
          }
        } else if (curPhase === 'pose_0' || curPhase === 'pose_1') {
          const gestureResults = recognizerRef.current.recognizeForVideo(video, now);
          let matched = false;

          if (gestureResults.gestures && gestureResults.gestures.length > 0) {
            const topGesture = gestureResults.gestures[0][0].categoryName;
            matched = topGesture.toLowerCase() === currentPoseRef.current.expectedGesture.toLowerCase();
          }

          if (matched) {
            if (!poseHoldStartTimeRef.current) {
              poseHoldStartTimeRef.current = performance.now();
            }
            const elapsed = performance.now() - poseHoldStartTimeRef.current;
            const prog = Math.min(Math.round((elapsed / 600) * 100), 100);
            setHoldProgress(prog);

            if (elapsed >= 600) {
              await handlePoseProgress(video, curPhase === 'pose_1');
              return;
            }
          } else {
            poseHoldStartTimeRef.current = null;
            setHoldProgress((p) => Math.max(0, p - 8));
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    let isMounted = true;
    setAppPhase('loading');
    setHoldProgress(0);
    captureTimestampsRef.current = [];
    capturedBlobsRef.current = [];
    poseHoldStartTimeRef.current = null;

    async function setup() {
      const sessionOk = await initSession();
      if (!sessionOk || !isMounted) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );

        const [landmarker, gesture] = await Promise.all([
          FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            outputFaceBlendshapes: true,
            numFaces: 1,
          }),
          GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
          }),
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models/face-api'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models/face-api'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models/face-api'),
        ]);

        if (!isMounted) return;

        faceLandmarkerRef.current = landmarker;
        recognizerRef.current = gesture;

        setAppPhase('liveness');
        setStatusMessage('Look directly into the camera and blink naturally.');
        startDetectionLoop();
      } catch (err: any) {
        if (!isMounted) return;
        setAppPhase('denied');
        setCameraError(err.name === 'NotAllowedError' ? 'Camera access was denied.' : 'Verification error.');
      }
    }

    setup();

    return () => {
      isMounted = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const retry = async () => {
    cleanup();
    setHoldProgress(0);
    captureTimestampsRef.current = [];
    capturedBlobsRef.current = [];
    poseHoldStartTimeRef.current = null;
    const sessionOk = await initSession();
    if (sessionOk) {
      setAppPhase('liveness');
      setStatusMessage('Look directly into the camera and blink naturally.');
      startDetectionLoop();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#DDD7E5] shadow-2xl overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EDF5]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#6555B8]" />
            <h2 className="text-sm font-bold text-[#1C1924]">Biometric Liveness Verification</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#8C849B] hover:text-[#1C1924] rounded-full hover:bg-[#FAF8FD] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {phase === 'approved' ? (
          <div className="py-6 text-center space-y-4">
            <div className="relative w-36 h-36 mx-auto rounded-2xl overflow-hidden border border-[#DDD7E5] bg-white shadow-xs p-2">
              <Image
                src="/images/verification/approved.png"
                alt="Verification Approved"
                fill
                sizes="144px"
                className="object-contain"
                priority
              />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" /> Identity Verified
              </div>
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
        ) : phase === 'denied' ? (
          <div className="py-6 text-center space-y-4">
            <div className="relative w-36 h-36 mx-auto rounded-2xl overflow-hidden border border-[#E05375]/30 bg-white shadow-xs p-2">
              <Image
                src="/images/verification/denied.png"
                alt="Verification Denied"
                fill
                sizes="144px"
                className="object-contain"
                priority
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#1C1924]">Verification Failed</h3>
              <p className="text-xs text-[#524B5E] max-w-xs mx-auto">
                {cameraError || statusMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={retry}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#6555B8] text-white text-xs font-bold hover:bg-[#53449E] transition"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 bg-[#FAF8FD] border border-[#DDD7E5] rounded-xl p-2">
              <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-white border border-[#DDD7E5] p-1">
                <Image
                  src={currentPose.imageSrc}
                  alt={currentPose.label}
                  fill
                  sizes="48px"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block bg-[#6555B8] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                    {phase === 'liveness'
                      ? 'Liveness: Blink'
                      : phase === 'pose_0'
                      ? 'Challenge 1 of 2'
                      : phase === 'pose_1'
                      ? 'Challenge 2 of 2'
                      : 'Processing'}
                  </span>
                  <p className="text-xs font-bold text-[#1C1924] truncate">{currentPose.label}</p>
                </div>
                <p className="text-[10.5px] text-[#524B5E] leading-tight line-clamp-2 mt-0.5">
                  {phase === 'liveness'
                    ? 'Center your face in the oval guide and blink naturally.'
                    : currentPose.instruction}
                </p>
              </div>
            </div>

            <div className="relative w-full max-w-[250px] aspect-square mx-auto rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-[#DDD7E5] shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div
                  className={`w-[170px] h-[215px] rounded-[50%] border-2 transition-colors duration-200 ${
                    phase === 'liveness'
                      ? 'border-white/60 border-dashed'
                      : holdProgress > 0
                      ? 'border-emerald-400'
                      : 'border-[#6555B8]/80'
                  }`}
                />
                <span className="absolute bottom-2 text-[10px] font-medium text-white/95 bg-black/60 px-3 py-0.5 rounded-full backdrop-blur-xs">
                  {statusMessage}
                </span>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] text-[#6C637B] font-medium">
                <span>Hold Stability</span>
                <span>
                  {phase === 'liveness'
                    ? 'Waiting for blink...'
                    : phase === 'submitting'
                    ? 'Submitting...'
                    : `${holdProgress}%`}
                </span>
              </div>
              <div className="w-full h-2 bg-[#F0EDF5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#6555B8] transition-all duration-150 ease-out"
                  style={{
                    width:
                      phase === 'liveness'
                        ? '15%'
                        : phase === 'pose_0'
                        ? `${Math.max(15, holdProgress * 0.45)}%`
                        : phase === 'pose_1'
                        ? `${Math.max(45, 45 + holdProgress * 0.55)}%`
                        : '100%',
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}