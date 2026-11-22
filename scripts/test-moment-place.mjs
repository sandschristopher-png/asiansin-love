// Spot-tagged Moments: the place text and the maps links. Run: npm run place:test
import { loadLib } from './lib/load-ts.mjs';

const p = await loadLib('momentPlace');
const intents = await loadLib('intents');
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

console.log(`moment place and intents: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error('  FAIL ' + f);
  process.exit(1);
}
