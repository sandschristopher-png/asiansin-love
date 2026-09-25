'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SavedProfile {
  id: string;
  fullName: string;
  age: number;
  city: string;
  country: string;
  avatarUrl: string;
  isVerified: boolean;
  relationshipIntent: string;
  jobTitle?: string;
  isOnline?: boolean;
}

interface FavoritesContextType {
  favorites: SavedProfile[];
  toggleFavorite: (profile: SavedProfile) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<SavedProfile[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ail_favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not read saved favorites:', e);
    }
  }, []);

  const toggleFavorite = (profile: SavedProfile) => {
    setFavorites((prev) => {
      const exists = prev.some((p) => p.id === profile.id);
      let updated: SavedProfile[];
      if (exists) {
        updated = prev.filter((p) => p.id !== profile.id);
      } else {
        updated = [...prev, profile];
      }
      try {
        localStorage.setItem('ail_favorites', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save favorites:', e);
      }
      return updated;
    });
  };

  const isFavorite = (id: string) => favorites.some((p) => p.id === id);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
