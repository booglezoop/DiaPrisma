const SUPABASE_URL = 'https://tkzgggyebjiubqldpywi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

exports.handler = async function (event) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Rate limit check — max 5 submissions per IP per hour
  // (basic, relies on Supabase count — no Redis needed)
  const ip = event.headers['x-forwarded-for']?.split(',')[0].trim() || 'unknown';

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Server-side validation
  const { name, phone, email } = payload;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return { statusCode: 400, body: 'Invalid name' };
  }
  if (!phone || typeof phone !== 'string') {
    return { statusCode: 400, body: 'Invalid phone' };
  }
  const phoneClean = phone.replace(/[\s\-]/g, '');
  if (!/^\+?[0-9]{7,15}$/.test(phoneClean)) {
    return { statusCode: 400, body: 'Invalid phone format' };
  }
  if (email && typeof email === 'string' && email.length > 0) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { statusCode: 400, body: 'Invalid email format' };
    }
  }

  // Rate limit — check submissions from this IP in the last hour
  try {
    const rateLimitRes = await fetch(
      `${SUPABASE_URL}/rest/v1/leads?select=id&ip=eq.${ip}&created_at=gte.${new Date(Date.now() - 3600000).toISOString()}`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );
    const existing = await rateLimitRes.json();
    if (Array.isArray(existing) && existing.length >= 5) {
      return { statusCode: 429, body: 'Too many submissions. Please try again later.' };
    }
  } catch (e) {
    console.warn('Rate limit check failed:', e);
    // Don't block submission if rate limit check fails
  }

  // Sanitise and build the DB payload
  const dbPayload = {
    name:               name.trim(),
    phone:              phoneClean,
    email:              email?.trim() || '',
    ip,                  // store IP for rate limiting
    track:              payload.track || '',
    client_score:       payload.client_score,
    client_tier:        payload.client_tier || '',
    lead_quality_score: payload.lead_quality_score,
    lead_tier:          payload.lead_tier || '',
    primary_risk:       payload.primary_risk || '',
    location:           payload.location || '',
    neighborhood:       payload.neighborhood || '',
    property_type:      payload.property_type || '',
    construction_type:  payload.construction_type || '',
    area:               payload.area || '',
    listed:             payload.listed || '',
    pm_timeline:        payload.pm_timeline || '',
    pm_price_strategy:  payload.pm_price_strategy || '',
    pm_docs:            payload.pm_docs || '',
    pm_priority:        payload.pm_priority || '',
    om_offers:          payload.om_offers || '',
    om_viewings:        payload.om_viewings || '',
    om_price_basis:     payload.om_price_basis || '',
    om_changes:         payload.om_changes || '',
    fears:              payload.fears || ''
  };

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
      console.error('Supabase error:', err);
      return { statusCode: 500, body: 'Database error' };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': 'https://doma-real-estate.netlify.app' },
      body: JSON.stringify({ success: true })
    };

  } catch (e) {
    console.error('Function error:', e);
    return { statusCode: 500, body: 'Server error' };
  }
};
