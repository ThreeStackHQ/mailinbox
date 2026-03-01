export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, users, inboxes, eq } from "@mailinbox/db";
import { hash, genSalt } from "bcryptjs";
import { z } from "zod";
import { randomBytes } from "crypto";

const createInboxSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  emailPrefix: z.string()
    .min(3, "Email prefix must be at least 3 chars")
    .max(40)
    .regex(/^[a-z0-9._+-]+$/, "Only lowercase letters, numbers, and . _ + - allowed")
    .optional(),
});

const EMAIL_DOMAIN = process.env["SMTP_DOMAIN"] ?? "mailinbox.threestack.io";

function generatePrefix(): string {
  return randomBytes(4).toString("hex"); // e.g. "a1b2c3d4"
}

function generateSmtpPassword(): string {
  return randomBytes(16).toString("base64url"); // 22 chars, URL-safe
}

// GET /api/inboxes — list user's inboxes
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userInboxes = await db
      .select({
        id: inboxes.id,
        name: inboxes.name,
        emailAddress: inboxes.emailAddress,
        isActive: inboxes.isActive,
        emailCount: inboxes.emailCount,
        createdAt: inboxes.createdAt,
        updatedAt: inboxes.updatedAt,
      })
      .from(inboxes)
      .where(eq(inboxes.userId, session.user.id))
      .orderBy(inboxes.createdAt);

    return NextResponse.json(userInboxes);
  } catch (error) {
    console.error("[GET /api/inboxes]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/inboxes — create inbox
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createInboxSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    // Generate email address
    let prefix = parsed.data.emailPrefix ?? generatePrefix();
    let emailAddress = `${prefix}@${EMAIL_DOMAIN}`;
    let attempts = 0;

    // Ensure uniqueness
    while (attempts < 10) {
      const [existing] = await db
        .select({ id: inboxes.id })
        .from(inboxes)
        .where(eq(inboxes.emailAddress, emailAddress))
        .limit(1);

      if (!existing) break;
      prefix = generatePrefix();
      emailAddress = `${prefix}@${EMAIL_DOMAIN}`;
      attempts++;
    }

    // Generate and hash SMTP password
    const plainSmtpPassword = generateSmtpPassword();
    const smtpPasswordHash = await hash(plainSmtpPassword, 10);

    const [inbox] = await db
      .insert(inboxes)
      .values({
        userId: session.user.id,
        name: parsed.data.name,
        emailAddress,
        smtpPassword: smtpPasswordHash,
        isActive: true,
        emailCount: 0,
      })
      .returning();

    if (!inbox) {
      return NextResponse.json({ error: "Failed to create inbox" }, { status: 500 });
    }

    return NextResponse.json(
      {
        ...inbox,
        // Return plain password once — never stored in plain text again
        smtpPassword: plainSmtpPassword,
        smtpHost: process.env["SMTP_HOST_PUBLIC"] ?? "smtp.threestack.io",
        smtpPort: parseInt(process.env["SMTP_PORT"] ?? "2525", 10),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/inboxes]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
