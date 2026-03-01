/**
 * @mailinbox/storage
 * Cloudflare R2 storage client (S3-compatible API).
 *
 * Sprint 1.4 — S3 Email Storage
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "crypto";

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;

  const accountId = process.env["R2_ACCOUNT_ID"];
  const accessKeyId = process.env["R2_ACCESS_KEY_ID"];
  const secretAccessKey = process.env["R2_SECRET_ACCESS_KEY"];

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials not configured (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)");
  }

  _client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return _client;
}

const BUCKET = process.env["R2_BUCKET"] ?? "mailinbox-emails";

/** Upload email HTML body to R2. Returns the object key. */
export async function uploadEmailBody(
  inboxId: string,
  emailId: string,
  htmlBody: string
): Promise<string> {
  const client = getClient();
  const key = `emails/${inboxId}/${emailId}/body.html`;

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: htmlBody,
      ContentType: "text/html; charset=utf-8",
      // Auto-delete after 30 days via lifecycle policy (set in Cloudflare dashboard)
      // Metadata for reference:
      Metadata: {
        "inbox-id": inboxId,
        "email-id": emailId,
      },
    })
  );

  return key;
}

/** Upload an email attachment to R2. Returns the object key. */
export async function uploadAttachment(
  inboxId: string,
  emailId: string,
  filename: string,
  content: Buffer,
  contentType: string
): Promise<string> {
  const client = getClient();
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueId = randomBytes(4).toString("hex");
  const key = `emails/${inboxId}/${emailId}/attachments/${uniqueId}_${safeFilename}`;

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: content,
      ContentType: contentType,
      ContentDisposition: `attachment; filename="${safeFilename}"`,
      Metadata: {
        "inbox-id": inboxId,
        "email-id": emailId,
        "original-filename": filename,
      },
    })
  );

  return key;
}

/** Generate a pre-signed URL for fetching an object (expires in 1 hour). */
export async function getPresignedUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const client = getClient();

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/** Delete an object from R2. */
export async function deleteObject(key: string): Promise<void> {
  const client = getClient();

  await client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

/** Build a public CDN URL for an object (if bucket has public access). */
export function getPublicUrl(key: string): string {
  const cdnUrl = process.env["R2_PUBLIC_URL"];
  if (cdnUrl) {
    return `${cdnUrl.replace(/\/$/, "")}/${key}`;
  }
  // Fallback to presigned URL approach (caller must use getPresignedUrl)
  return key;
}
