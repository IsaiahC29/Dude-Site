// Vercel serverless function: /api/votd
// Uses API.Bible correctly and matches the env var names we'll set in Vercel.

export default async function handler(req, res) {
  try {
    const API_KEY  = process.env.API_BIBLE_KEY; // <-- must be set in Vercel
    const BIBLE_ID = process.env.API_BIBLE_ID;  // <-- must be set in Vercel (e.g., KJV: de4e12af7f28f599-02)

    if (!API_KEY || !BIBLE_ID) {
      return res.status(500).json({ error: "Server not configured (missing env vars)." });
    }

    // For first test, fetch a known verse (John 3:16).
    // Once this works, we can swap to a daily plan that changes automatically.
    const reference = "John 3:16";

    // 1) Resolve the verse reference to an internal verse/passage ID
    const searchUrl = `https://api.scripture.api.bible/v1/bibles/${BIBLE_ID}/search?query=${encodeURIComponent(reference)}&limit=1`;
    const s = await fetch(searchUrl, { headers: { "api-key": API_KEY } });
    const sj = await s.json();
    const verseId = sj?.data?.verses?.[0]?.id || sj?.data?.passages?.[0]?.id;

    if (!verseId) {
      return res.status(500).json({ error: "Could not resolve verse reference." });
    }

    // 2) Get the passage text as plain text
    const passUrl = `https://api.scripture.api.bible/v1/bibles/${BIBLE_ID}/passages/${verseId}?contentType=text&includeVerseNumbers=false&includeFootnotes=false&includeTitles=false&includeChapterNumbers=false`;
    const p = await fetch(passUrl, { headers: { "api-key": API_KEY } });
    const pj = await p.json();

    const text = (pj?.data?.content || "").trim();
    const refOut = pj?.data?.reference || reference;

    // Optional caching
    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=600");
    return res.status(200).json({ reference: refOut, text, translationId: BIBLE_ID });
  } catch (e) {
    return res.status(500).json({ error: "Failed to load verse." });
  }
}
