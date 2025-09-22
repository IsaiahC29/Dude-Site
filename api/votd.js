export default async function handler(req, res) {
  try {
    const bibleId = process.env.API_BIBLE; // example: "de4e12af7f28f599-02"
    const verseId = "JHN.3.16"; // John 3:16 as a test

    const response = await fetch(
      `https://api.scripture.api.bible/v1/bibles/${bibleId}/verses/${verseId}`,
      {
        headers: {
          "api-key": process.env.API_BIBLE_KEY,
        },
      }
    );

    const data = await response.json();

    res.status(200).json({
      reference: data.data.reference,
      text: data.data.content, // full verse HTML text
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}