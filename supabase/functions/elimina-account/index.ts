// Elimina l'account di chi chiama: assegnazioni, profilo e utente Auth.
// Le segnalazioni restano, con inserito_da a null (FK on delete set null).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

  const url = Deno.env.get("SUPABASE_URL")!;
  const auth = req.headers.get("Authorization") ?? "";
  const comeUtente = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: { user }, error } = await comeUtente.auth.getUser();
  if (error || !user) return Response.json({ error: "Non autenticato" }, { status: 401, headers: cors });

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { db: { schema: "rischio_clinico" } });
  const a = await admin.from("assegnazioni_reparto").delete().eq("profile_id", user.id);
  if (a.error) return Response.json({ error: a.error.message }, { status: 500, headers: cors });
  const p = await admin.from("profiles").delete().eq("id", user.id);
  if (p.error) return Response.json({ error: p.error.message }, { status: 500, headers: cors });
  const u = await admin.auth.admin.deleteUser(user.id);
  if (u.error) return Response.json({ error: u.error.message }, { status: 500, headers: cors });
  return Response.json({ ok: true }, { headers: cors });
});
