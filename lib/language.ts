/**
 * Cheap, offline check for whether a chat message is worth offering "Translate" on.
 * Not a language detector: it only needs to hide the button on plain English ("Hi", "Test",
 * "How was your day?") and show it for the languages our members actually mix in.
 *
 *   - any non-Latin script (Thai, Khmer, Lao, Burmese, CJK, Korean...)      -> translate
 *   - Latin letters with diacritics (Vietnamese, accented Tagalog/Spanish)   -> translate
 *   - romanized Tagalog / Bisaya / Bahasa / Thai / Vietnamese marker words   -> translate
 * Regression cases live in scripts/test-moderation.mjs.
 */

// Words that are essentially never English. One is enough.
const STRONG_MARKERS = new Set([
  // Tagalog / Taglish
  'ako', 'ikaw', 'kayo', 'tayo', 'kami', 'sila', 'siya', 'niya', 'nila', 'natin', 'namin', 'ninyo', 'mo', 'ko',
  'po', 'opo', 'naman', 'lang', 'talaga', 'kumusta', 'kamusta', 'salamat', 'mahal', 'kita', 'gusto', 'ganda',
  'gwapo', 'pogi', 'maganda', 'sige', 'ingat', 'kain', 'kumain', 'ngayon', 'bukas', 'kahapon', 'saan', 'bakit',
  'paano', 'ilan', 'ano', 'sino', 'kailan', 'hindi', 'wala', 'meron', 'yung', 'yan', 'ito', 'iyan', 'dito',
  'diyan', 'doon', 'pala', 'kasi', 'sana', 'nga', 'din', 'rin', 'daw', 'raw', 'muna', 'nako', 'hay', 'grabe',
  'sobra', 'miss', 'namiss', 'antok', 'pagod', 'trabaho', 'uwi', 'labas', 'tulog', 'gising', 'mga', 'ng',
  // Bisaya / Cebuano
  'unsa', 'nimo', 'nako', 'kaayo', 'diay', 'jud', 'gyud', 'bitaw', 'lagi', 'karon', 'ugma', 'asa', 'ngano',
  'wala', 'naa', 'unya', 'pud', 'sab', 'gihapon', 'palangga', 'gwapa', 'maayo', 'buntag', 'gabii', 'kaon',
  'imong', 'akong', 'ikaw', 'kamo', 'lingaw', 'kapoy',
  // Bahasa Indonesia / Malay
  'aku', 'kamu', 'saya', 'anda', 'apa', 'kabar', 'sayang', 'cantik', 'terima', 'kasih', 'tidak', 'bukan',
  'sudah', 'belum', 'mau', 'makan', 'sekarang', 'besok', 'dimana', 'kenapa', 'bagaimana', 'baik', 'cinta',
  // Romanized Thai
  'khrap', 'krub', 'khrub', 'kha', 'khob', 'khun', 'sawasdee', 'sawatdee', 'sabai', 'mai', 'arai', 'chan',
  'phom', 'pom', 'aroi', 'jing', 'mak', 'naka', 'nakrub',
  // Vietnamese without accents
  'anh', 'em', 'yeu', 'khong', 'cam', 'xin', 'chao', 'duoc', 'nhe', 'nha', 'roi', 'gi', 'oi', 'vay',
]);

// Short particles that could appear in English text ("na", "sa", "ka", "ba"...). Two needed.
const WEAK_MARKERS = new Set(['na', 'sa', 'ka', 'ba', 'ang', 'si', 'ni', 'ug', 'ra']);

// Marker words that are also English words or names: they only count next to a real particle.
const ENGLISH_COLLISIONS = new Set(['miss', 'ano', 'mai', 'chan', 'em', 'gi', 'mak', 'hay', 'cam', 'pom', 'din', 'apa', 'ko', 'mo', 'ng', 'anh', 'oi', 'naka',
  'raw', 'hindi', 'ilan', 'yan', 'sab', 'sino', 'gusto', 'jing', 'lang']);

/** Letters outside basic Latin (scripts) or Latin with diacritics. */
// (Emoji joiners / variation selectors are format characters, not letters.)
const NON_ASCII_LETTER = /[^\u0000-\u007F\p{Emoji}\p{P}\p{S}\p{Z}\p{N}\p{Cf}\uFE0E\uFE0F\u20E3]/u;

export function needsTranslation(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  if (NON_ASCII_LETTER.test(trimmed)) return true;

  const words = trimmed.toLowerCase().match(/[a-z']+/g) || [];
  if (words.length === 0) return false;

  let strong = 0;
  let weak = 0;
  let collisions = 0;
  for (const raw of words) {
    const w = raw.replace(/'/g, '');
    if (ENGLISH_COLLISIONS.has(w)) collisions++;
    else if (STRONG_MARKERS.has(w)) strong++;
    else if (WEAK_MARKERS.has(w)) weak++;
  }
  // English-looking words ("miss", "Lang") only count once a real particle is present.
  return strong >= 1 || weak >= 2 || (weak >= 1 && weak + collisions >= 2);
}
