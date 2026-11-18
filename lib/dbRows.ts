/**
 * A row read straight from Supabase (`select('*')` or a wide column list).
 *
 * The Supabase client in this project is not generated from the database schema, so wide table rows
 * (profiles, messages, sparks) arrive untyped. This is the one named escape hatch for them: use it where a
 * row's shape really is "whatever the table has", and write a small explicit interface wherever a code path
 * only reads a few known fields.
 *
 * To remove it for good: run `supabase gen types typescript` once, pass the result as the client's `Database`
 * generic in lib/supabase/client.ts and the server clients, then replace `DbRow` with the generated row types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbRow = Record<string, any>;
