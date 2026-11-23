// Spot-tagged Moments: the place text and the maps links. Run: npm run place:test
import { loadLib } from './lib/load-ts.mjs';

const p = await loadLib('momentPlace');
const intents = await loadLib('intents');
const map = await loadLib('momentMap');
const pal = await loadLib('mapPalette');
let passed = 0;
const failures = [];
const ok = (name, cond) => (cond ? passed++ : failures.push(name));

ok('whitespace and control characters collapse', p.cleanPlace('  Kapitolyo \n night\tmarket \u0007 ') === 'Kapitolyo night market');
ok('empty and non-text input mean no spot', p.cleanPlace('') === '' && p.cleanPlace(null) === '' && p.cleanPlace(undefined) === '' && p.cleanPlace('   ') === '');
ok('the spot is capped at 80 characters', p.cleanPlace('x'.repeat(200)).length === 80 && p.MAX_PLACE === 80);
ok('the query is the spot in its city', p.placeQuery('Tops Lookout', 'Cebu City') === 'Tops Lookout, Cebu City' && p.placeQuery('Tops Lookout', '') === 'Tops Lookout');

const q = p.placeQuery('Cafe Uno & Co', 'Manila');
const g = p.directionsUrl('google', q, 'walk');
ok('google directions: destination encoded, walking', g.startsWith('https://www.google.com/maps/dir/?api=1&destination=Cafe%20Uno%20%26%20Co%2C%20Manila') && g.endsWith('&travelmode=walking'));
ok('google modes', p.directionsUrl('google', q, 'drive').endsWith('travelmode=driving') && p.directionsUrl('google', q, 'transit').endsWith('travelmode=transit'));
ok('apple directions and modes', p.directionsUrl('apple', q, 'walk').endsWith('&dirflg=w') && p.directionsUrl('apple', q, 'drive').endsWith('&dirflg=d') && p.directionsUrl('apple', q, 'transit').endsWith('&dirflg=r') && p.directionsUrl('apple', q, 'walk').startsWith('https://maps.apple.com/?daddr='));
ok('an injected query cannot add parameters', !p.directionsUrl('google', 'x&travelmode=driving#', 'walk').includes('&travelmode=driving#'));

// The five "Looking for" intents, in order, and the old values that fold into them
ok('five intents in the agreed order', intents.INTENT_OPTIONS.map((o) => o.label).join('|') === 'Friends|Local Guide|Casual Dating|Serious Relationship|Figuring it Out');
const n = intents.normalizeIntent;
ok('old marriage / dating / friendship values fold into the five', n('marriage') === 'serious_relationship' && n('Marriage & Kids') === 'serious_relationship' && n('dating') === 'casual_dating' && n('casual') === 'casual_dating' && n('friendship') === 'friends' && n('Friends') === 'friends');
ok('the new values are kept as they are', intents.INTENT_OPTIONS.every((o) => n(o.value) === o.value));
ok('unknown or empty is no intent', n('') === '' && n(null) === '' && n('something else') === '');
ok('labels', intents.intentLabel('local_guide') === 'Local Guide' && intents.intentLabel('marriage') === 'Serious Relationship' && intents.intentLabel('nope') === '');

// The spot map: pins are rounded and kept near their city
ok('a pin is rounded to 3 decimals (about 110 m)', map.roundPin(10.315712) === 10.316 && map.roundPin(123.88549) === 123.885);
const near = map.pinToStore('Cebu', 'Tops Lookout', 10.3457, 123.8854);
ok('a pin near its city is stored, rounded', near !== null && near.lat === 10.346 && near.lng === 123.885);
ok('a pin across the world is dropped', map.pinToStore('Cebu', 'Tops Lookout', 35.68, 139.69) === null);
ok('a pin in another city of the country is dropped', map.pinToStore('Cebu', 'Tops Lookout', 14.5995, 120.9842) === null);
ok('a pin without a place name is dropped', map.pinToStore('Cebu', '   ', 10.3157, 123.8854) === null);
ok('bad coordinates are dropped', map.pinToStore('Cebu', 'x', NaN, 123.8) === null && map.pinToStore('Cebu', 'x', 91, 123.8) === null && map.pinToStore('Cebu', 'x', 10.3, 'a') === null && map.pinToStore('Cebu', 'x', 0, 0) === null);
ok('a city outside the list has no pin', map.pinToStore('Atlantis', 'x', 10.3, 123.8) === null);
ok('isLatLng', map.isLatLng(10, 120) === true && map.isLatLng(NaN, 1) === false && map.isLatLng('10', 1) === false);
ok('the map style is a keyless light style by default', typeof map.MAP_STYLE_URL === 'string' && map.MAP_STYLE_URL.includes('positron'));

// Where the map opens: the member's city at city zoom (never coordinates or the device), the pins when none are near, Manila last
const st = map.pickMapStart;
ok('the profile city centre at zoom 12', st({ city: 'Cebu City' })?.zoom === 12 && st({ city: 'Cebu City' })?.source === 'city' && st({ city: 'Cebu City' })?.center[0] === 10.3157);
ok('a municipality counts as its hub', st({ city: 'Taguig' })?.center[0] === 14.5995);
ok('coordinates and the device are not inputs: only a city places the camera', st({ profileLat: 10.32, profileLng: 123.9 }) === null && st({ device: { lat: 7.19, lng: 125.45 } }) === null);
ok('an unknown or outside-Asia city has no start', st({}) === null && st({ city: 'Las Vegas' }) === null && st({ city: '' }) === null && st({ city: null }) === null);
ok('the start is never closer than city zoom', ['Manila', 'Bangkok', 'Phnom Penh', 'Singapore'].every((c) => (st({ city: c })?.zoom ?? 0) <= 12));
const manila = st({ city: 'Manila' });
const nearManila = [{ lat: 14.55, lng: 121.02 }];
const inCebu = [{ lat: 10.3157, lng: 123.8854 }];
ok('no pins anywhere: nothing to frame', map.shouldFitPins(manila, []) === false && map.shouldFitPins(null, []) === false);
ok('pins near the member: stay on the city', map.shouldFitPins(manila, nearManila) === false && map.shouldFitPins(manila, [...nearManila, ...inCebu]) === false);
ok('pins only elsewhere: frame the pins', map.shouldFitPins(manila, inCebu) === true);
ok('no known city but pins exist: frame the pins', map.shouldFitPins(null, inCebu) === true);
ok('a pin just inside and just outside 100 km', map.shouldFitPins(manila, [{ lat: 15.45, lng: 120.9842 }]) === false && map.shouldFitPins(manila, [{ lat: 15.6, lng: 120.9842 }]) === true);
ok('framing constants', map.FIT_PADDING === 48 && map.FIT_MAX_ZOOM === 14 && map.NEARBY_KM === 100 && map.START_ZOOM === 12);
ok('the empty-map fallback is Southeast Asia as a whole', map.FALLBACK_CENTER[0] === 12.5 && map.FALLBACK_CENTER[1] === 114.0 && map.FALLBACK_ZOOM === 4.2);
const cam = map.pickCamera;
ok('no pins anywhere: the Southeast Asia overview, even for a member with a known city', cam(manila, []).fit === false && cam(manila, []).zoom === 4.2 && cam(null, []).zoom === 4.2 && cam(manila, []).center[0] === 12.5);
ok('pins near the member: their city at zoom 12', cam(manila, nearManila).fit === false && cam(manila, nearManila).zoom === 12 && cam(manila, nearManila).center[0] === 14.5995);
ok('pins only elsewhere: frame them', cam(manila, inCebu).fit === true);
ok('no known city but pins exist: frame them', cam(null, inCebu).fit === true);

// The map palette: warm land, periwinkle water, sage parks, white roads with soft casings, dark slate labels
function fakeMap(layers, refuse = []) {
  const sets = [];
  return {
    sets,
    getLayer: (id) => (layers.includes(id) ? {} : undefined),
    setPaintProperty: (id, prop, value) => {
      if (refuse.includes(id)) throw new Error('refused');
      sets.push([id, prop, value]);
    },
  };
}
const all = ['background', 'water', 'park', 'highway_major_inner', 'highway_major_casing', 'highway-name-minor', 'label_city'];
const m1 = fakeMap(all);
const n1 = pal.applyMapPalette(m1);
const got = (id, prop) => m1.sets.find(([i, p]) => i === id && p === prop)?.[2];
ok('the palette repaints the layers a style has', n1 === all.length && m1.sets.length === all.length);
ok('land, water, park', got('background', 'background-color') === '#FAF9FC' && got('water', 'fill-color') === '#DFE3EE' && got('park', 'fill-color') === '#EAEFE9');
ok('roads are white with soft casings', got('highway_major_inner', 'line-color') === '#FFFFFF' && got('highway_major_casing', 'line-color') === '#E6E4EE');
ok('street and place labels are dark slate', got('highway-name-minor', 'text-color') === '#4B5563' && got('label_city', 'text-color') === '#4B5563');
ok('a style with none of these layers is left alone without an error', pal.applyMapPalette(fakeMap(['something_else'])) === 0);
const m2 = fakeMap(all, ['water']);
ok('a layer that refuses a property does not stop or throw', pal.applyMapPalette(m2) === all.length - 1 && m2.sets.some(([i]) => i === 'park'));
ok('a map whose lookups throw cannot throw into the page', pal.applyMapPalette({ getLayer: () => { throw new Error('x'); }, setPaintProperty: () => {} }) === 0);

console.log(`moment place and intents: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error('  FAIL ' + f);
  process.exit(1);
}
