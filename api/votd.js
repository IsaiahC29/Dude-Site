// Simpler, more reliable version: directly fetch a known verse by reference.
// Once this shows the verse on the page, we can switch to the daily-rotation plan.

export default async function handler(req, res) {
  try {
    const API_KEY  = process.env.API_BIBLE_KEY; // set in Vercel
    const BIBLE_ID = process.env.API_BIBLE_ID;  // set in Vercel (e.g., de4e12af7f28f599-02 for KJV)
    if (!API_KEY || !BIBLE_ID) {
      return res.status(500).json({ error: "Server not configured (missing env vars)." });
    }

    // Start with a single verse to prove it works:
    const verseRef = "JHN.3.16";

    // Ask API.Bible for plain text
    const url = `https://api.scripture.api.bible/v1/bibles/${BIBLE_ID}/verses/${verseRef}?contentType=text&includeVerseNumbers=false&includeFootnotes=false&includeTitles=false&includeChapterNumbers=false`;

    const r = await fetch(url, { headers: { "api-key": API_KEY } });
    const j = await r.json();

    // Some translations return HTML even with contentType=text, so strip tags just in case.
    const raw = (j?.data?.content || "").trim();
    const text = raw.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

    if (!text) {
      return res.status(500).json({ error: "Verse text was empty." });
    }

    return res.status(200).json({
      reference: j?.data?.reference || "John 3:16",
      text,
      translationId: BIBLE_ID
    });
  } catch (e) {
    return res.status(500).json({ error: "Failed to load verse." });
  }
}