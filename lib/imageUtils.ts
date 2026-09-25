import imageCompression from 'browser-image-compression';

export async function compressProfileImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.2,            // Target max ~200KB
    maxWidthOrHeight: 1080,    // Portrait clarity
    useWebWorker: true,
    fileType: 'image/webp'     // Convert to lightweight modern format
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Compression fallback to original file:', error);
    return file;
  }
}
