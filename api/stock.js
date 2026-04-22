export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: "Symbol required" });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=1d&range=1mo`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Yahoo Finance error: ${response.status}` });
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      return res.status(404).json({ error: "Symbol not found" });
    }

    const meta   = result.meta;
    const quotes = result.indicators?.quote?.[0];
    const ts     = result.timestamp || [];

    const prices = ts.map((t, i) => ({
      date:   new Date(t * 1000).toLocaleDateString("en", { month: "numeric", day: "numeric" }),
      close:  quotes.close?.[i]  ? +quotes.close[i].toFixed(2)         : null,
      volume: quotes.volume?.[i] ? +(quotes.volume[i] / 1e6).toFixed(2) : 0,
    })).filter(p => p.close !== null);

    return res.status(200).json({
      symbol:        meta.symbol,
      companyName:   meta.longName || meta.shortName || symbol,
      currentPrice:  meta.regularMarketPrice,
      previousClose: meta.previousClose || meta.chartPreviousClose,
      dayHigh:       meta.regularMarketDayHigh,
      dayLow:        meta.regularMarketDayLow,
      weekHigh52:    meta.fiftyTwoWeekHigh,
      weekLow52:     meta.fiftyTwoWeekLow,
      marketCapB:    meta.marketCap ? (meta.marketCap / 1e9).toFixed(1) : null,
      volumeM:       meta.regularMarketVolume ? (meta.regularMarketVolume / 1e6).toFixed(1) : null,
      currency:      meta.currency || "USD",
      prices,
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
