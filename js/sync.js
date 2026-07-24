/* ============================================================
   DREAMCAST — cross-device sync via Supabase
   ------------------------------------------------------------
   To enable: create a free Supabase project, run the SQL in
   README.md, then fill in these two values (the anon key is
   designed to be public — data is protected by row-level
   security, not by hiding the key).
   ============================================================ */

export const SUPABASE_URL = 'https://asetladucgiuboldbgjz.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_X7_eo8KV_zSJky4skPEEiA_uoAGsdVv'; // publishable key — safe to be public

let client = null;

export function syncEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

async function getClient() {
  if (!client) {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return client;
}

/** Signed-in user, or null. */
export async function currentUser() {
  try {
    const c = await getClient();
    const { data } = await c.auth.getUser();
    return data.user || null;
  } catch {
    return null;
  }
}

/** Email a 6-digit sign-in code. */
export async function sendCode(email) {
  const c = await getClient();
  const { error } = await c.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw error;
}

/** Verify the emailed code; establishes the session. */
export async function verifyCode(email, token) {
  const c = await getClient();
  const { error } = await c.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
}

export async function signOut() {
  const c = await getClient();
  await c.auth.signOut();
}

/** Fetch this user's saved state from the cloud (null if none yet). */
export async function pullRemote() {
  const c = await getClient();
  const { data: { user } } = await c.auth.getUser();
  if (!user) return null;
  const { data, error } = await c.from('dreamcast_state')
    .select('data').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return data?.data || null;
}

/** Save the full state to the cloud. */
export async function pushRemote(state) {
  const c = await getClient();
  const { data: { user } } = await c.auth.getUser();
  if (!user) return false;
  const { error } = await c.from('dreamcast_state').upsert({
    user_id: user.id,
    data: state,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return true;
}
