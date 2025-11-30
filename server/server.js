// server/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: './.env.local.admin' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PORT = process.env.PORT || 8787;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.admin');
  process.exit(1);
}

// Ensure fetch is available (Node 18+ has global fetch). If not, dynamically import node-fetch.
let fetchFn = global.fetch;
if (!fetchFn) {
  fetchFn = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
}

const app = express();
app.use(cors());
app.use(express.json());

// --------- Existing /api/register route ----------
function validatePayload(body) {
  if (!body) return 'No body';
  const { email, password, name } = body;
  if (!email || typeof email !== 'string') return 'Missing valid email';
  if (!password || typeof password !== 'string' || password.length < 6)
    return 'Password min 6 chars';
  if (!name || typeof name !== 'string') return 'Missing name';
  return null;
}

app.post('/api/register', async (req, res) => {
  const err = validatePayload(req.body);
  if (err) return res.status(400).json({ error: err });

  const { email, password, name, pincode = null } = req.body;

  try {
    const adminUrl = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users`;
    const createResp = await fetchFn(adminUrl, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        //email_confirm: true, // instant usable account
        user_metadata: { full_name: name, pincode: pincode }   // <<-- send name so triggers can use it
      }),
    });

    const createJson = await createResp.json();

    if (!createResp.ok) {
      console.error('Admin create failed:', createJson);
      return res.status(400).json({ error: 'admin_create_failed', detail: createJson });
    }

    const userId = createJson?.id;
    if (!userId) {
      console.error('Admin created user but no id returned:', createJson);
      return res.status(500).json({ error: 'admin_no_userid', detail: createJson });
    }

    const profilesUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/profiles`;
    const profilePayload = {
      id: userId,
      email: createJson.email,
      name: name || null,
      pincode: pincode || null,
      created_at: new Date().toISOString(),
    };

    const profileResp = await fetchFn(profilesUrl, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(profilePayload),
    });

    const profileJson = await profileResp.json();

    if (!profileResp.ok) {
      console.error('Profile insert failed:', profileJson);

      try {
        const deleteResp = await fetchFn(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
        });

        if (!deleteResp.ok) {
          const delJson = await deleteResp.json().catch(() => ({}));
          console.error('Cleanup delete-auth-user failed:', delJson);
        } else {
          console.log(`Rolled back auth user ${userId} after profile insert failure.`);
        }
      } catch (cleanupErr) {
        console.error('Cleanup delete-auth-user exception:', cleanupErr);
      }

      return res.status(500).json({ error: 'profile_insert_failed', detail: profileJson });
    }

    return res.status(201).json({ ok: true, user: createJson, profile: profileJson });
  } catch (e) {
    console.error('Register handler error:', e);
    return res.status(500).json({ error: 'server_error', detail: String(e) });
  }
});

// --------- New /api/report route ----------
app.post('/api/report', async (req, res) => {
  const { userId, location, pincode } = req.body;

  if (!userId || !location) {
    return res.status(400).json({ error: 'Missing userId or location' });
  }

  try {
    const reportsUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/reports`;
    const payload = {
      user_id: userId,
      location,
      pincode: pincode || null,
      created_at: new Date().toISOString(),
    };

    const resp = await fetchFn(reportsUrl, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    const json = await resp.json();

    if (!resp.ok) {
      console.error('Report insert failed:', json);
      return res.status(500).json({ error: 'report_insert_failed', detail: json });
    }

    return res.status(201).json({ ok: true, report: json });
  } catch (e) {
    console.error('Report handler error:', e);
    return res.status(500).json({ error: 'server_error', detail: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
