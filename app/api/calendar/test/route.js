// app/api/calendar/test/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  try {
    // build JWT auth right here (no external imports)
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL!,
      key: process.env.GOOGLE_PRIVATE_KEY!,
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/contacts",
      ],
      subject: process.env.GOOGLE_IMPERSONATE_SUBJECT!, // e.g. ops@rebelribbon.com
    });

    const calendarId = process.env.GOOGLE_CALENDAR_ID!;
    const calendar = google.calendar({ version: "v3", auth });

    // make an event 10 minutes from now for 60 minutes
    const now = new Date();
    const start = new Date(now.getTime() + 10 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const { data } = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: "Rebel Ribbon Test Delivery",
        description: "Created via /api/calendar/test",
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      },
    });

    return NextResponse.json({ ok: true, eventId: data.id });
  } catch (e: any) {
    return new NextResponse(e?.message || "error", { status: 500 });
  }
}
