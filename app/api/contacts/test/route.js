import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY,
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/contacts",
      ],
      subject: process.env.GOOGLE_IMPERSONATE_SUBJECT,
    });

    const people = google.people({ version: "v1", auth });
    const stamp = Date.now().toString().slice(-6);

    const { data } = await people.people.createContact({
      requestBody: {
        names: [{ givenName: "Test", familyName: `Contact${stamp}` }],
        emailAddresses: [{ value: `test+${stamp}@rebelribbon.com` }],
        phoneNumbers: [{ value: "555-0000" }],
      },
    });

    return NextResponse.json({ ok: true, resourceName: data.resourceName });
  } catch (e) {
    return new NextResponse(e?.message || "error", { status: 500 });
  }
}
