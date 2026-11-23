/**
 * Meet in Asia's colors for the spot map. OpenFreeMap's "positron" is a cold grey; once its style has loaded
 * (MapCanvas calls applyMapPalette on `style.load`) the land, water, parks, roads and labels are repainted in the site's warm
 * lavender-neutral palette so the #726E97 pins sit on a map that belongs to the page.
 *
 * Every lookup is guarded: a layer that the chosen style does not have (a different NEXT_PUBLIC_MAP_STYLE_URL, or a later
 * change to positron) is skipped, and nothing here can throw into the map. No imports, so it can be tested with a fake map.
 */

export const LAND = '#FAF9FC'; // warm alabaster: the page surface
export const WATER = '#DFE3EE'; // muted periwinkle-slate
export const PARK = '#EAEFE9'; // whisper-soft sage
export const ROAD = '#FFFFFF'; // primary roads
export const ROAD_CASING = '#E6E4EE'; // their delicate casings
export const LABEL = '#4B5563'; // street and neighborhood names: dark slate

const ROAD_MINOR = '#EFEDF4';
const BUILDING = '#F1EFF6';

type Paint = readonly [layerId: string, property: string, value: string];

const PAINT: readonly Paint[] = [
  // Land
  ['background', 'background-color', LAND],
  ['landuse_residential', 'fill-color', '#F6F4FA'],
  ['building', 'fill-color', BUILDING],
  ['building', 'fill-outline-color', ROAD_CASING],
  ['aeroway-area', 'fill-color', ROAD],
  ['road_area_pier', 'fill-color', LAND],
  ['road_pier', 'line-color', LAND],
  // Parks and green
  ['park', 'fill-color', PARK],
  ['landcover_wood', 'fill-color', PARK],
  // Water
  ['water', 'fill-color', WATER],
  ['waterway', 'line-color', WATER],
  // Primary roads and their casings
  ['highway_major_inner', 'line-color', ROAD],
  ['highway_motorway_inner', 'line-color', ROAD],
  ['highway_motorway_bridge_inner', 'line-color', ROAD],
  ['highway_major_casing', 'line-color', ROAD_CASING],
  ['highway_motorway_casing', 'line-color', ROAD_CASING],
  ['highway_motorway_bridge_casing', 'line-color', ROAD_CASING],
  ['tunnel_motorway_casing', 'line-color', ROAD_CASING],
  ['tunnel_motorway_inner', 'line-color', BUILDING],
  // Smaller roads, paths, rail, runways
  ['highway_minor', 'line-color', ROAD_MINOR],
  ['highway_path', 'line-color', ROAD_MINOR],
  ['highway_major_subtle', 'line-color', ROAD_MINOR],
  ['highway_motorway_subtle', 'line-color', ROAD_MINOR],
  ['aeroway-taxiway', 'line-color', ROAD_MINOR],
  ['aeroway-runway-casing', 'line-color', ROAD_CASING],
  ['aeroway-runway', 'line-color', ROAD],
  ['railway', 'line-color', ROAD_CASING],
  ['railway_service', 'line-color', ROAD_CASING],
  ['railway_transit', 'line-color', ROAD_CASING],
  ['railway_dashline', 'line-color', LAND],
  ['railway_service_dashline', 'line-color', LAND],
  ['railway_transit_dashline', 'line-color', LAND],
  // Borders
  ['boundary_2', 'line-color', '#C9C6D6'],
  ['boundary_3', 'line-color', '#C9C6D6'],
  ['boundary_disputed', 'line-color', '#C9C6D6'],
  // Labels: street and place names in dark slate, water names in a soft periwinkle-slate
  ['highway-name-path', 'text-color', LABEL],
  ['highway-name-minor', 'text-color', LABEL],
  ['highway-name-major', 'text-color', LABEL],
  ['airport', 'text-color', LABEL],
  ['label_other', 'text-color', LABEL],
  ['label_village', 'text-color', LABEL],
  ['label_town', 'text-color', LABEL],
  ['label_state', 'text-color', LABEL],
  ['label_city', 'text-color', LABEL],
  ['label_city_capital', 'text-color', LABEL],
  ['label_country_3', 'text-color', LABEL],
  ['label_country_2', 'text-color', LABEL],
  ['label_country_1', 'text-color', LABEL],
  ['water_name_point_label', 'text-color', '#6B7AA3'],
  ['water_name_line_label', 'text-color', '#6B7AA3'],
  ['waterway_line_label', 'text-color', '#6B7AA3'],
];

/** What applyMapPalette needs from a map: maplibre's Map satisfies it, and so does a test double. */
export interface PaletteTarget {
  getLayer(id: string): unknown;
  setPaintProperty(id: string, property: string, value: string): unknown;
}

/** Repaints the map. Returns how many properties it changed (layers a style does not have are skipped, never an error). */
export function applyMapPalette(map: PaletteTarget): number {
  let changed = 0;
  for (const [id, property, value] of PAINT) {
    try {
      if (map.getLayer(id)) {
        map.setPaintProperty(id, property, value);
        changed++;
      }
    } catch {
      // One layer that refuses a property must not stop the rest, or throw into the map.
    }
  }
  return changed;
}
