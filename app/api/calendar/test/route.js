import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  try {
    // Normalize the private key from env:
    // - If it's pasted with real newlines → keep as-is
    // - If it's one line with \n → convert to real newlines
    // - Strip accidental wrapping quotes
    const raw = process.env.GOOGLE_PRIVATE_KEY || "";
    const privateKey = (
      raw.includes("BEGIN") ? raw : raw.replace(/\\n/g, "\n")
    )
      .replace(/\r/g, "\n")
      .replace(/^"+|"+$/g, ""); // remove leading/trailing quotes if present

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: privateKey,
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/contacts",
      ],
      subject: process.env.GOOGLE_IMPERSONATE_SUBJECT, // e.g. ops@rebelribbon.com
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

    return NextResponse.json({ ok: true, eventId: data.id });
  } catch (e) {
    // Return the message so we can see the next error, but not the key.
    return new NextResponse(
      typeof e?.message === "string" ? e.message : "error",
      { status: 500 }
    );
  }
}
