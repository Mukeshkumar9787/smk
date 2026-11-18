import { PutObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";
import { DEFAULT_TENANT_ID, getTenantContext } from "./tenantContext.js";

const requiredEnvKeys = [
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
];

export const isR2Configured = () =>
  requiredEnvKeys.every((key) => Boolean(process.env[key]));

const getR2Client = () => {
  if (!isR2Configured()) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
};

const getR2PublicBaseUrl = () =>
  (process.env.R2_PUBLIC_BASE_URL || process.env.R2_ENDPOINT).replace(/\/+$/, "");

const sanitizeFilename = (filename = "file") =>
  filename.replace(/[^a-zA-Z0-9._-]/g, "-");

const buildObjectData = (filename) => {
  const extension = path.extname(filename || "");
  const basename = path.basename(filename || "file", extension);
  const rawName = `${Date.now()}-${sanitizeFilename(basename)}${extension}`;
  const tenantId = getTenantContext()?.tenantId;
  const storedPath =
    tenantId && tenantId !== DEFAULT_TENANT_ID
      ? `tenants/${tenantId}/${rawName}`
      : rawName;
  const bucketPath = (process.env.R2_BUCKET_PATH || "uploads").replace(/^\/+|\/+$/g, "");
  return {
    storedPath,
    objectKey: `${bucketPath}/${storedPath}`,
  };
};

export const getDirectUploadConfig = async ({ filename, contentType }) => {
  const client = getR2Client();
  const { storedPath, objectKey } = buildObjectData(filename);
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: objectKey,
      ContentType: contentType,
    }),
    { expiresIn: Number(process.env.R2_SIGNED_URL_TTL_SECONDS || 900) }
  );

  return {
    uploadUrl,
    path: storedPath,
  };
};

export const uploadFileToR2 = async (file) => {
  if (!file) {
    throw new Error("No file received");
  }

  if (!isR2Configured()) {
    return {
      path: file.path,
    };
  }

  const client = getR2Client();
  const { storedPath, objectKey } = buildObjectData(file.originalname);

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: objectKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return {
    path: storedPath,
  };
};

export const deleteR2FileByUrl = async (fileUrl) => {
  if (!isR2Configured() || !fileUrl) {
    return;
  }

  const publicBaseUrl = getR2PublicBaseUrl();
  if (!fileUrl.startsWith(publicBaseUrl)) {
    return;
  }

  const client = getR2Client();
  const key = decodeURIComponent(fileUrl.slice(publicBaseUrl.length + 1));

  if (!key) {
    return;
  }

  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
    })
  );
};

export const deleteR2FileByPath = async (filePath) => {
  if (!isR2Configured() || !filePath) {
    return;
  }

  const client = getR2Client();
  const bucketPath = (process.env.R2_BUCKET_PATH || "uploads").replace(/^\/+|\/+$/g, "");

  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: `${bucketPath}/${filePath}`,
    })
  );
};
