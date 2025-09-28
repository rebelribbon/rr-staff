// app/api/calendar/test/route.ts
import { NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/google";

export async function GET() {
  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID!;
    const now = new Date();
    const start = new Date(now.getTime() + 10 * 60 * 1000); // 10 mins from now
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour long

    const event = await createCalendarEvent(calendarId, {
      summary: "Rebel Ribbon Test Delivery",
      description: "Created via /api/calendar/test",
      start: { dateTime: start.toISOString() },
      end:   { dateTime: end.toISOString()   },
    });

    return NextResponse.json({ ok: true, eventId: event.id });
  } catch (e: any) {
    return new NextResponse(e?.message || "error", { status: 500 });
  }
}
