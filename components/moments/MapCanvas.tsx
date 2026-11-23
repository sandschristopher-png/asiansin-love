'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Map as MlMap, Marker as MlMarker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabaseImage, AVATAR_IMAGE } from '@/lib/images/supabaseImage';
import { MAP_STYLE_URL } from '@/lib/momentMap';
import { applyMapPalette } from '@/lib/mapPalette';
import { FIT_MAX_ZOOM, FIT_PADDING } from '@/lib/momentMap';

export interface Pin {
  id: string;
  lat: number;
  lng: number;
  label: string;
  avatarUrl: string | null;
}

/**
 * The light basemap with member pins (avatar circles with a purple ring) and, for the Moments composer's picker, one
 * movable "chosen spot" marker. maplibre-gl is imported inside an effect, never at module load, so nothing touches
 * `window` on the server and a default-export difference between bundlers cannot crash the page; this component itself is
 * loaded with next/dynamic (ssr: false). Everything it creates (map, markers, resize observer) is removed on unmount.
 * Pins are plain DOM elements positioned by maplibre; the avatar button inside carries the CSS transform (globals.css .ail-pin).
 */
export default function MapCanvas({
  pins = [],
  selectedId = null,
  onPinClick,
  onMapClick,
  marker = null,
  center,
  zoom = 12,
  fit = false,
}: {
  pins?: Pin[];
  selectedId?: string | null;
  onPinClick?: (id: string) => void;
  /** Tap (or drag the chosen-spot marker) to report a position: the picker uses this. */
  onMapClick?: (lat: number, lng: number) => void;
  /** The chosen spot (picker only). */
  marker?: { lat: number; lng: number } | null;
  /** [latitude, longitude] to open on. */
  center: readonly [number, number];
  zoom?: number;
  /** Frame all the pins when they load. */
  fit?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const libRef = useRef<typeof import('maplibre-gl') | null>(null);
  const pinMarkers = useRef<MlMarker[]>([]);
  const chosenMarker = useRef<MlMarker | null>(null);
  const [ready, setReady] = useState(false);
  // The basemap fades in once it carries our colors, so the stock grey never flashes while tiles load.
  const [styled, setStyled] = useState(false);
  // Latest callbacks, so the map is created once and never re-created when a parent re-renders.
  const onPin = useRef(onPinClick);
  const onTap = useRef(onMapClick);
  useEffect(() => {
    onPin.current = onPinClick;
    onTap.current = onMapClick;
  });

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    (async () => {
      const mod = await import('maplibre-gl');
      if (cancelled || !box.current) return;
      const lib = ((mod as unknown as { default?: typeof mod }).default ?? mod) as typeof import('maplibre-gl');
      libRef.current = lib;
      // The tile worker is a static file (see scripts/copy-maplibre-worker.mjs): the bundler cannot resolve it.
      lib.setWorkerUrl('/maplibre-gl-worker.mjs');
      const map = new lib.Map({
        container: box.current,
        style: MAP_STYLE_URL,
        center: [center[1], center[0]],
        zoom,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
        maxPitch: 0,
        renderWorldCopies: false,
      });
      map.touchZoomRotate.disableRotation();
      // Repaint the basemap in the site's lavender-neutral palette as soon as its style is there (guarded: never throws).
      map.on('style.load', () => {
        applyMapPalette(map);
        if (!cancelled) setStyled(true);
      });
      map.on('click', (e) => onTap.current?.(e.lngLat.lat, e.lngLat.lng));
      mapRef.current = map;
      // Markers do not need the basemap: they show as soon as the map exists, even if tiles are slow or offline.
      setReady(true);
      observer = new ResizeObserver(() => map.resize());
      observer.observe(box.current);
    })().catch((err) => console.error('[map] could not start:', err));

    return () => {
      cancelled = true;
      observer?.disconnect();
      pinMarkers.current.forEach((m) => m.remove());
      pinMarkers.current = [];
      chosenMarker.current?.remove();
      chosenMarker.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      setReady(false);
      setStyled(false);
    };
    // The map is created once; center and zoom only matter at the start (a later center change is handled below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pins.
  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!ready || !map || !lib) return;
    pinMarkers.current.forEach((m) => m.remove());
    pinMarkers.current = pins.map((pin) => {
      const root = document.createElement('div');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ail-pin';
      btn.setAttribute('aria-label', pin.label);
      btn.dataset.selected = pin.id === selectedId ? 'true' : 'false';
      if (pin.avatarUrl) {
        const img = document.createElement('img');
        img.src = supabaseImage(pin.avatarUrl, AVATAR_IMAGE);
        img.alt = '';
        img.width = 36;
        img.height = 36;
        img.loading = 'lazy';
        img.decoding = 'async';
        btn.appendChild(img);
      } else {
        btn.textContent = pin.label.charAt(0).toUpperCase();
      }
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onPin.current?.(pin.id);
      });
      root.appendChild(btn);
      return new lib.Marker({ element: root, anchor: 'center' }).setLngLat([pin.lng, pin.lat]).addTo(map);
    });
  }, [ready, pins, selectedId]);

  // Frame the pins once they are there.
  const fitted = useRef('');
  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!ready || !map || !lib || !fit || pins.length === 0) return;
    const key = pins.map((p) => p.id).join(',');
    if (fitted.current === key) return;
    fitted.current = key;
    if (pins.length === 1) {
      map.jumpTo({ center: [pins[0].lng, pins[0].lat], zoom: 14 });
      return;
    }
    const bounds = new lib.LngLatBounds([pins[0].lng, pins[0].lat], [pins[0].lng, pins[0].lat]);
    pins.forEach((p) => bounds.extend([p.lng, p.lat]));
    map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, duration: 0 });
  }, [ready, pins, fit]);

  // The chosen spot (picker): a draggable purple dot.
  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!ready || !map || !lib) return;
    if (!marker) {
      chosenMarker.current?.remove();
      chosenMarker.current = null;
      return;
    }
    if (chosenMarker.current) {
      chosenMarker.current.setLngLat([marker.lng, marker.lat]);
      return;
    }
    const el = document.createElement('div');
    el.className = 'ail-chosen';
    const m = new lib.Marker({ element: el, anchor: 'center', draggable: true }).setLngLat([marker.lng, marker.lat]).addTo(map);
    m.on('dragend', () => {
      const p = m.getLngLat();
      onTap.current?.(p.lat, p.lng);
    });
    chosenMarker.current = m;
  }, [ready, marker]);

  // A new city centre (the picker follows the Moment's city).
  const lastCenter = useRef(`${center[0]},${center[1]}`);
  useEffect(() => {
    const key = `${center[0]},${center[1]}`;
    if (key === lastCenter.current) return;
    lastCenter.current = key;
    mapRef.current?.jumpTo({ center: [center[1], center[0]], zoom });
  }, [center, zoom]);

  // maplibre's stylesheet sets position: relative on the element it mounts into, which would undo an absolute fill: so the
  // map gets its own full-size child inside the absolutely positioned wrapper.
  return (
    <div className="absolute inset-0 bg-[#FAF9FC]">
      <div ref={box} className={`h-full w-full transition-opacity duration-300 motion-reduce:transition-none ${styled ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
}
