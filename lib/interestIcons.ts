import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Camera,
  ChefHat,
  Church,
  Clapperboard,
  Coffee,
  Dumbbell,
  Gamepad2,
  House,
  Leaf,
  MessageCircle,
  Mic,
  Mountain,
  Palette,
  PawPrint,
  Plane,
  Sailboat,
  ShoppingBag,
  Sofa,
  Waves,
  Wine,
} from 'lucide-react';

/** Interest / hobby tag -> Lucide icon (the UI never renders emoji). */
const INTEREST_ICONS: Record<string, LucideIcon> = {
  'cooking & food': ChefHat,
  'beach & ocean': Waves,
  'island hopping': Sailboat,
  'family first': House,
  travel: Plane,
  'movies & cinema': Clapperboard,
  'music & karaoke': Mic,
  'fitness & gym': Dumbbell,
  'health & wellness': Leaf,
  'coffee & cafes': Coffee,
  'hiking & outdoors': Mountain,
  'faith & church': Church,
  homebody: Sofa,
  'nightlife & bars': Wine,
  'shopping & malls': ShoppingBag,
  photography: Camera,
  'pets & animals': PawPrint,
  'mobile gaming & esports': Gamepad2,
  'art & design': Palette,
  'business & career': Briefcase,
};

export function interestIcon(tag: string | null | undefined): LucideIcon | null {
  return INTEREST_ICONS[String(tag || '').trim().toLowerCase()] ?? null;
}

/** Same lookup with a neutral fallback, for places that always show an icon (highlights). */
export function interestIconOrDefault(tag: string | null | undefined): LucideIcon {
  return interestIcon(tag) ?? MessageCircle;
}
