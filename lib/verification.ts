export interface VerificationChallenge {
  id: string;
  title: string;
  instruction: string;
  badge: string;
}

export const VERIFICATION_CHALLENGES: VerificationChallenge[] = [
  {
    id: 'three_fingers',
    title: 'Three Fingers Up',
    instruction: 'Hold up three fingers (index, middle, and ring) beside your cheek in good lighting.',
    badge: '🤟 3 Fingers',
  },
  {
    id: 'peace_sign',
    title: 'Peace Sign Beside Face',
    instruction: 'Make a clear peace sign (two fingers) next to your eyes or cheek with your face fully visible.',
    badge: '✌️ Peace Sign',
  },
  {
    id: 'thumbs_up_chin',
    title: 'Thumbs-Up at Chin',
    instruction: 'Hold a thumbs-up gesture directly alongside your chin facing the camera.',
    badge: '👍 Thumbs Up',
  },
  {
    id: 'open_palm',
    title: 'Open Palm Facing Forward',
    instruction: 'Hold an open flat palm next to your cheek, fingers straight up toward the ceiling.',
    badge: '✋ Open Palm',
  },
];

export interface ImageQualityResult {
  valid: boolean;
  error?: string;
  brightness?: number;
  blob?: Blob;
  previewUrl?: string;
}

/**
 * Validates image resolution, checks luminance (preventing black/overexposed frames),
 * and compresses down to an optimal size (~1280px max, Web-ready JPEG).
 */
export async function validateAndCompressVerificationImage(
  file: File
): Promise<ImageQualityResult> {
  return new Promise((resolve) => {
    // 1. Basic type check
    if (!file.type.startsWith('image/')) {
      return resolve({ valid: false, error: 'Please choose an image file (JPEG, PNG, HEIC).' });
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      // 2. Minimum resolution check (reject low-res bot thumbnails)
      if (width < 320 || height < 320) {
        return resolve({
          valid: false,
          error: 'Image resolution is too low. Please take a clear, high-resolution selfie.',
        });
      }

      // 3. Compute scale for compression (max dimension 1280px)
      const maxDim = 1280;
      let targetW = width;
      let targetH = height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          targetW = maxDim;
          targetH = Math.round((height * maxDim) / width);
        } else {
          targetH = maxDim;
          targetW = Math.round((width * maxDim) / height);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        return resolve({ valid: false, error: 'Canvas processing failed on this device.' });
      }

      ctx.drawImage(img, 0, 0, targetW, targetH);

      // 4. Sample luminance from the CENTER region of the frame
      try {
        const sampleSize = Math.min(100, targetW, targetH);
        const startX = Math.max(0, Math.floor((targetW - sampleSize) / 2));
        const startY = Math.max(0, Math.floor((targetH - sampleSize) / 2));
        const sampleData = ctx.getImageData(startX, startY, sampleSize, sampleSize).data;
        let totalBrightness = 0;
        const totalPixels = sampleData.length / 4;

        for (let i = 0; i < sampleData.length; i += 4) {
          // Standard perceived luminance: 0.299R + 0.587G + 0.114B
          const r = sampleData[i];
          const g = sampleData[i + 1];
          const b = sampleData[i + 2];
          totalBrightness += 0.299 * r + 0.587 * g + 0.114 * b;
        }

        const avgBrightness = Math.round(totalBrightness / totalPixels);

        // Under 25 is essentially pitch-black; over 248 is completely blown out
        if (avgBrightness < 25) {
          return resolve({
            valid: false,
            error: 'Photo is too dark. Please take your selfie in a well-lit room or facing light.',
            brightness: avgBrightness,
          });
        }

        if (avgBrightness > 248) {
          return resolve({
            valid: false,
            error: 'Photo has excessive glare or is washed out. Please step away from direct flash/glare.',
            brightness: avgBrightness,
          });
        }

        // 5. Output compressed high-quality JPEG
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve({ valid: false, error: 'Failed to compress photo.' });
            }
            const previewUrl = URL.createObjectURL(blob);
            resolve({
              valid: true,
              brightness: avgBrightness,
              blob,
              previewUrl,
            });
          },
          'image/jpeg',
          0.85
        );
      } catch (err: any) {
        return resolve({ valid: false, error: err?.message || 'Failed to analyze photo quality.' });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ valid: false, error: 'Failed to read image. Please retake the photo.' });
    };

    img.src = objectUrl;
  });
}