// /api/votd — robust version that works with API.Bible
export default async function handler(req, res) {
  try {
    const API_KEY  = process.env.API_BIBLE_KEY; // set in Vercel
    const BIBLE_ID = process.env.API_BIBLE_ID;  // e.g., KJV: de4e12af7f28f599-02
    if (!API_KEY || !BIBLE_ID) {
      return res.status(500).json({ error: "Missing API_BIBLE_KEY or API_BIBLE_ID." });
    }

    // Start with a known reference; once this works we’ll rotate daily
    const reference = "John 3:16";

    // 1) Resolve the reference to an internal id
    const searchUrl = `https://api.scripture.api.bible/v1/bibles/${BIBLE_ID}/search?query=${encodeURIComponent(reference)}&limit=1`;
    const s = await fetch(searchUrl, { headers: { "api-key": API_KEY } });
    if (!s.ok) {
      const t = await s.text();
      return res.status(500).json({ error: `Search failed: ${s.status} ${t}` });
    }
    const sj = await s.json();
    const verseId = sj?.data?.verses?.[0]?.id || sj?.data?.passages?.[0]?.id;
    if (!verseId) {
      return res.status(500).json({ error: "Could not resolve verse id from search." });
    }

    // 2) Fetch the passage text
    const passUrl = `https://api.scripture.api.bible/v1/bibles/${BIBLE_ID}/passages/${verseId}?contentType=text&includeVerseNumbers=false&includeFootnotes=false&includeTitles=false&includeChapterNumbers=false`;
    const p = await fetch(passUrl, { headers: { "api-key": API_KEY } });
    if (!p.ok) {
      const t = await p.text();
      return res.status(500).json({ error: `Passage fetch failed: ${p.status} ${t}` });
    }
    const pj = await p.json();

    const raw = (pj?.data?.content || "").trim();
    const text = raw.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const refOut = pj?.data?.reference || reference;

    if (!text) {
      return res.status(500).json({ error: "Verse text was empty after fetch." });
    }

    // Cache for an hour
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
    return res.status(200).json({ reference: refOut, text, translationId: BIBLE_ID });
  } catch (e) {
    return res.status(500).json({ error: "Unexpected server error." });
  }
}