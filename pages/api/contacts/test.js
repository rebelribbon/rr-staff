// pages/api/contacts/test.js
import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("Method Not Allowed");

  try {
    const raw = process.env.GOOGLE_PRIVATE_KEY || "";
    const privateKey = raw
      .replace(/\\n/g, "\n")
      .replace(/\r/g, "")
      .replace(/^"+|"+$/g, "");

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/contacts"],
      subject: process.env.GOOGLE_IMPERSONATE_SUBJECT, // your staff Gmail
    });

    const people = google.people({ version: "v1", auth });

    // Create a test contact
    const { data } = await people.people.createContact({
      requestBody: {
        names: [{ givenName: "Rebel", familyName: "RibbonTest" }],
        emailAddresses: [{ value: "test+contact@rebelribbon.com" }],
        phoneNumbers: [{ value: "+1-210-555-1234" }],
      },
    });

    res.status(200).json({ ok: true, resourceName: data.resourceName });
  } catch (e) {
    console.error("Contacts API error:", e);
    res.status(500).send(e?.message || "error");
  }
}
