/**
 * Vercel Serverless Function — Client Visit & Activity Logger
 * Logs visitor details (Time in WIT, City, Device, Referrer, and Clicked Actions)
 * directly to the Vercel Dashboard -> Logs tab.
 */

module.exports = async function handler(req, res) {
  // Allow CORS & preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const body = typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : (req.body || {});

    const eventType = body.event || req.query?.event || 'PAGE_OPEN';
    const detail = body.detail || req.query?.detail || '-';
    const tag = body.tag || req.query?.ref || req.query?.client || 'direct';
    const screenSize = body.screen || '-';
    const referrer = body.referrer || req.headers['referer'] || 'direct';

    // Extract geo & network info provided automatically by Vercel Edge headers
    const city = decodeURIComponent(req.headers['x-vercel-ip-city'] || 'Unknown City');
    const region = req.headers['x-vercel-ip-country-region'] || '';
    const country = req.headers['x-vercel-ip-country'] || 'ID';
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown-ip';
    const ua = req.headers['user-agent'] || '';

    // Parse simple human-readable device type from User-Agent
    let device = 'Desktop';
    if (/iPhone/i.test(ua)) device = 'iPhone (iOS)';
    else if (/iPad/i.test(ua)) device = 'iPad';
    else if (/Android/i.test(ua)) device = 'HP Android';
    else if (/Macintosh/i.test(ua)) device = 'Mac / MacBook';
    else if (/Windows/i.test(ua)) device = 'Windows PC';

    // Format timestamp in WIT (Waktu Indonesia Timur - Asia/Jayapura)
    const timeWIT = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jayapura',
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date());

    // Structured, easy-to-read log entry in Vercel Dashboard -> Logs
    console.log(
      `[CLIENT-LOG] 📌 ${eventType} | Detail: ${detail} | Tag: ${tag} | Lokasi: ${city}${region ? ', ' + region : ''} (${country}) | Perangkat: ${device} (${screenSize}) | Waktu: ${timeWIT} WIT | IP: ${ip} | Ref: ${referrer}`
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[CLIENT-LOG ERROR]', err.message);
    return res.status(200).json({ ok: false });
  }
};
