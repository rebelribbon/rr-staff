// pages/api/calendar/test.js
import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("Method Not Allowed");

  try {
    const raw = process.env.GOOGLE_PRIVATE_KEY || "";
    const privateKey = raw.replace(/\\n/g, "\n").replace(/\r/g, "").replace(/^"+|"+$/g, "");

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: privateKey,
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/contacts",
      ],
      subject: process.env.GOOGLE_IMPERSONATE_SUBJECT,
    });

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    const calendar = google.calendar({ version: "v3", auth });

    const now = new Date();
    const start = new Date(now.getTime() + 10 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const { data } = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: "Rebel Ribbon Test Delivery",
        description: "Created via /api/calendar/test",
        start: { dateTime: start.toISOString() },
        end:   { dateTime: end.toISOString() },
      },
    });

    res.status(200).json({ ok: true, eventId: data.id });
  } catch (e) {
    res.status(500).send(e?.message || "error");
  }
}
