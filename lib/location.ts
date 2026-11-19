import { errMsg } from '@/lib/errors';
import { supabase } from '@/lib/supabase/client';

export interface LocationData {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

// Format relative date for "Verified 2 days ago"
export function formatVerifiedDate(dateString?: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}
// Capture GPS & reverse-geocode via Nominatim
export async function captureCurrentLocation(): Promise<{
  success: boolean;
  data?: LocationData;
  error?: string;
}> {
  if (!navigator.geolocation) {
    return { success: false, error: 'Geolocation not supported by device' };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const geo = await res.json();
          const addr = geo.address || {};

          const city =
            addr.city ||
            addr.town ||
            addr.municipality ||
            addr.village ||
            addr.county ||
            addr.state ||
            'Unknown';
          const country = addr.country || 'Unknown';

          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('profiles')
              .update({
                city,
                country,
                latitude,
                longitude,
                location_source: 'gps_verified',
                location_verified_at: new Date().toISOString(),
              })
              .eq('id', user.id);
          }

          resolve({
            success: true,
            data: { city, country, latitude, longitude },
          });
        } catch (err) {
          resolve({ success: false, error: errMsg(err) || 'Geocoding failed' });
        }
      },
      (err) => {
        let msg = 'Failed to retrieve GPS coordinates';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please allow access.';
        }
        resolve({ success: false, error: msg });
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  });
}
