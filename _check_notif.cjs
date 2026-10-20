require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data, error } = await sb.from("notifications").select("*").limit(5);
  console.log(error ? "ERROR: " + JSON.stringify(error, null, 2) : "ROWS: " + JSON.stringify(data, null, 2));
})();