// app/api/contacts/test/route.ts
import { NextResponse } from "next/server";
import { createContact } from "@/lib/google";


export async function GET() {
  try {
    const stamp = Date.now().toString().slice(-6);
    const person = await createContact({
      names: [{ givenName: "Test", familyName: `Contact${stamp}` }],
      emailAddresses: [{ value: `test+${stamp}@rebelribbon.com` }],
      phoneNumbers: [{ value: "555-0000" }],
    });
    return NextResponse.json({ ok: true, resourceName: person.resourceName });
  } catch (e: any) {
    return new NextResponse(e?.message || "error", { status: 500 });
  }
}
