import { supabase } from '@/lib/supabaseClient';

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

// Distance computation using Haversine formula
export function getDistanceLabel(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): string | null {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = Math.round((R * c) / 10) * 10;

  const rawKm = R * c;
  if (rawKm < 1) return '< 1 km away';
  if (rawKm < 10) return `${rawKm.toFixed(1)} km away`;
  if (rawKm > 1000) {
    const miles = Math.round(rawKm * 0.621371);
    return `${miles.toLocaleString()} mi away`;
  }
  return `${Math.round(rawKm)} km away`;
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
        } catch (err: any) {
          resolve({ success: false, error: err.message || 'Geocoding failed' });
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
