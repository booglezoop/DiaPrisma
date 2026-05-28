const SUPABASE_URL     = 'https://tkzgggyebjiubqldpywi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// ── Structured logger ────────────────────────────────────────────────────────
function log(requestId, level, message, data = {}) {
  console.log(JSON.stringify({
    requestId,
    level,
    message,
    timestamp: new Date().toISOString(),
    ...data
  }));
}

// ── Sanitise a string — strip HTML tags, trim, cap length ───────────────────
function sanitise(value, maxLength = 200) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')      // strip HTML tags
    .replace(/[<>'"`;]/g, '')     // strip chars used in injection attacks
    .trim()
    .slice(0, maxLength);
}

// ── CORS headers ─────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://doma-real-estate.netlify.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// ── Main handler ─────────────────────────────────────────────────────────────
exports.handler = async function (event) {
  // Generate a request ID for tracing this submission through the logs
  const requestId = Math.random().toString(36).slice(2, 10).toUpperCase();

  // Handle preflight OPTIONS request — required for CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: 'Method not allowed' };
  }

  const ip = event.headers['x-forwarded-for']?.split(',')[0].trim() || 'unknown';
  log(requestId, 'INFO', 'Submission received', { ip });

  // ── Parse body ─────────────────────────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    log(requestId, 'WARN', 'Invalid JSON body');
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid request format' })
    };
  }

  // ── Input validation ───────────────────────────────────────────────────────
  const { name, phone, email } = payload;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2 || !/[а-яА-ЯёЁa-zA-Z]/.test(name)) {
    errors.push('Моля, въведете вашето истинско ime.');
  }
  if (name && name.trim().length > 100) {
    errors.push('Името е твърде дълго.');
  }
  if (!phone || typeof phone !== 'string') {
    errors.push('Моля, въведете телефонен номер.');
  }
  const phoneClean = (phone || '').replace(/[\s\-]/g, '');
  if (phone && !/^\+?[0-9]{7,15}$/.test(phoneClean)) {
    errors.push('Моля, въведете валиден телефонен номер.');
  }
  if (email && email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Моля, въведете валиден имейл адрес.');
  }
  if (email && email.length > 200) {
    errors.push('Имейлът е твърде дълъг.');
  }

  // Score sanity checks — prevent manipulated payloads
  if (payload.client_score !== undefined) {
    const s = Number(payload.client_score);
    if (isNaN(s) || s < 0 || s > 100) {
      errors.push('Invalid score.');
    }
  }
  if (payload.lead_quality_score !== undefined) {
    const s = Number(payload.lead_quality_score);
    if (isNaN(s) || s < 0 || s > 100) {
      errors.push('Invalid lead score.');
    }
  }

  if (errors.length > 0) {
    log(requestId, 'WARN', 'Validation failed', { errors });
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: errors[0] }) // return first error to display
    };
  }

  // ── Rate limit ─────────────────────────────────────────────────────────────
  try {
    const since = new Date(Date.now() - 3600000).toISOString();
    const rateLimitRes = await fetch(
      `${SUPABASE_URL}/rest/v1/leads?select=id&ip=eq.${encodeURIComponent(ip)}&created_at=gte.${since}`,
      {
        headers: {
          'apikey':        SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );
    const existing = await rateLimitRes.json();
    if (Array.isArray(existing) && existing.length >= 5) {
      log(requestId, 'WARN', 'Rate limit hit', { ip });
      return {
        statusCode: 429,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Твърде много опити. Моля, опитайте по-късно.' })
      };
    }
  } catch (e) {
    // Non-blocking — log and continue rather than reject a legitimate submission
    log(requestId, 'WARN', 'Rate limit check failed', { error: e.message });
  }

  // ── Build sanitised DB payload ─────────────────────────────────────────────
  const dbPayload = {
    ip,
    name:               sanitise(name, 100),
    phone:              phoneClean,
    email:              sanitise(email || '', 200),
    track:              sanitise(payload.track, 10),
    client_score:       Number(payload.client_score) || 0,
    client_tier:        sanitise(payload.client_tier, 50),
    lead_quality_score: Number(payload.lead_quality_score) || 0,
    lead_tier:          sanitise(payload.lead_tier, 20),
    primary_risk:       sanitise(payload.primary_risk, 200),
    location:           sanitise(payload.location, 100),
    neighborhood:       sanitise(payload.neighborhood, 100),
    property_type:      sanitise(payload.property_type, 50),
    construction_type:  sanitise(payload.construction_type, 50),
    area:               sanitise(payload.area, 50),
    listed:             sanitise(payload.listed, 100),
    pm_timeline:        sanitise(payload.pm_timeline, 100),
    pm_price_strategy:  sanitise(payload.pm_price_strategy, 100),
    pm_docs:            sanitise(payload.pm_docs, 100),
    pm_priority:        sanitise(payload.pm_priority, 100),
    om_offers:          sanitise(payload.om_offers, 100),
    om_viewings:        sanitise(payload.om_viewings, 100),
    om_price_basis:     sanitise(payload.om_price_basis, 100),
    om_changes:         sanitise(payload.om_changes, 100),
    fears:              sanitise(payload.fears, 500)
  };

  // ── Write to Supabase ──────────────────────────────────────────────────────
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer':        'return=minimal'
      },
      body: JSON.stringify(dbPayload)
    });

    if (!res.ok) {
      const err = await res.text();
      log(requestId, 'ERROR', 'Supabase write failed', { status: res.status, error: err });
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Възникна грешка. Моля, опитайте отново.' })
      };
    }

    log(requestId, 'INFO', 'Submission successful', { ip, lead_tier: dbPayload.lead_tier });
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: true })
    };

  } catch (e) {
    log(requestId, 'ERROR', 'Unexpected function error', { error: e.message });
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Възникна грешка. Моля, опитайте отново.' })
    };
  }
};
