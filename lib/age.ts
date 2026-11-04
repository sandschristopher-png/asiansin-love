/**
 * A member's age: profiles.age when set, else computed from birthdate (many rows only have the
 * birthdate). Same 18..99 sanity range as Discover and Sparks; anything else is treated as unknown.
 */
export function ageOf(p: { age?: unknown; birthdate?: unknown; dob?: unknown } | null | undefined): number | null {
  if (!p) return null;
  if (typeof p.age === 'number' && p.age >= 18 && p.age < 100) return p.age;
  const raw = p.birthdate || p.dob;
  if (typeof raw !== 'string' || !raw) return null;
  const birth = new Date(raw);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age >= 18 && age < 100 ? age : null;
}
