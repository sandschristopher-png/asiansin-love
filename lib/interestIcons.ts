import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Bike,
  Briefcase,
  Camera,
  ChefHat,
  Church,
  Clapperboard,
  Coffee,
  Dices,
  Dumbbell,
  Flower2,
  Gamepad2,
  House,
  Languages,
  Leaf,
  MessageCircle,
  Mic,
  Mountain,
  Music,
  Palette,
  PawPrint,
  Plane,
  Sailboat,
  ShoppingBag,
  Sofa,
  Soup,
  Trophy,
  Tv,
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
  'street food & markets': Soup,
  'anime & manga': Tv,
  'k-drama & c-drama': Tv,
  'badminton & sports': Trophy,
  'road trips & motorbikes': Bike,
  'board games & trivia': Dices,
  'live music & concerts': Music,
  'language exchange': Languages,
  'reading & books': BookOpen,
  'yoga & mindfulness': Flower2,
};

export function interestIcon(tag: string | null | undefined): LucideIcon | null {
  return INTEREST_ICONS[String(tag || '').trim().toLowerCase()] ?? null;
}

/** Same lookup with a neutral fallback, for places that always show an icon (highlights). */
export function interestIconOrDefault(tag: string | null | undefined): LucideIcon {
  return interestIcon(tag) ?? MessageCircle;
}
