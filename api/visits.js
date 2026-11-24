// A fixed counter key; never proxy arbitrary URLs or expose third-party markup.
const counterURL = 'https://hits.sh/portfolio.rudravaghel.in/guestbook.svg';
const allowedOrigins = new Set(['https://portfolio.rudravaghel.in', 'https://rv-portfolio-five.vercel.app']);

export default async function visits(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({error: 'Method not allowed'});
  }
  if (!allowedOrigins.has(req.headers.origin)) return res.status(403).json({error: 'Origin not allowed'});
  try {
    const response = await fetch(counterURL, {signal: AbortSignal.timeout(6000), cache: 'no-store'});
    if (!response.ok) throw new Error('Counter service unavailable');
    const svg = await response.text();
    const match = svg.match(/<title>hits:\s*([\d,]+)<\/title>/i);
    const count = match ? Number(match[1].replaceAll(',', '')) : NaN;
    if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid counter response');
    return res.status(200).json({count});
  } catch {
    return res.status(503).json({error: 'Counter temporarily unavailable'});
  }
}
