// Minimal, reliable version: fetch John 3:16 text.
export default async function handler(req, res) {
  try {
    const API_KEY  = process.env.API_BIBLE_KEY;          // from Vercel
    const BIBLE_ID = process.env.API_BIBLE_ID;           // e.g. de4e12af7f28f599-02
    if (!API_KEY || !BIBLE_ID) {
      return res.status(500).json({ error: "Missing API_BIBLE_KEY or API_BIBLE_ID." });
    }

    // Use the Bible API's "verses" endpoint directly (OSIS id works across Bibles).
    const url = `https://api.scripture.api.bible/v1/bibles/${BIBLE_ID}/verses/JHN.3.16?contentType=text&includeVerseNumbers=false&includeFootnotes=false&includeTitles=false&includeChapterNumbers=false`;

    const r = await fetch(url, { headers: { "api-key": API_KEY } });
    if (!r.ok) {
      const body = await r.text();
      return res.status(500).json({ error: `API error ${r.status}: ${body}` });
    }

    const j = await r.json();
    const raw = (j?.data?.content || "").trim();
    const text = raw.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

    if (!text) return res.status(500).json({ error: "Verse text empty." });

    // Cache an hour on Vercel/CDN
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
    return res.status(200).json({ reference: j?.data?.reference || "John 3:16", text, translationId: BIBLE_ID });
  } catch (e) {
    return res.status(500).json({ error: "Unexpected server error." });
  }
}