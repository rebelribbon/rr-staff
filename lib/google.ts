// lib/google.ts
import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/contacts",
];

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL!,
    key: process.env.GOOGLE_PRIVATE_KEY!,
    scopes: SCOPES,
    subject: process.env.GOOGLE_IMPERSONATE_SUBJECT!, // e.g. ops@rebelribbon.com
  });
}

export async function createCalendarEvent(calendarId: string, body: any) {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });
  const { data } = await calendar.events.insert({ calendarId, requestBody: body });
  return data;
}

export async function createContact(body: any) {
  const auth = getAuth();
  const people = google.people({ version: "v1", auth });
  const { data } = await people.people.createContact({ requestBody: body });
  return data;
}
