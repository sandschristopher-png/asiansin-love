export interface HighlightItem {
  tag_id: string;
  label: string;
  icon?: string;
  highlight_story?: string;
  is_common_ground?: boolean;
}

export interface PublicProfileData {
  id: string;
  full_name: string;
  age: number | null;
  city: string;
  country: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  highlights: HighlightItem[];
}