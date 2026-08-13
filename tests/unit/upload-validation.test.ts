import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { uploadImage } from "@/lib/server/uploads";

describe("catalog image validation", () => {
  beforeEach(() => {
    process.env.DEPLOYMENT_MODE = "demo";
    process.env.STORAGE_ADAPTER = "fake";
    delete process.env.DATABASE_URL;
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  afterEach(() => {
    delete process.env.STORAGE_ADAPTER;
  });

  it("rejects empty and over-3-MiB files before storage", async () => {
    await expect(uploadImage(new File([], "empty.png", { type: "image/png" })))
      .rejects.toMatchObject({ status: 400, code: "IMAGE_REQUIRED" });

    const oversized = new File([new Uint8Array(3 * 1024 * 1024 + 1)], "large.png", { type: "image/png" });
    await expect(uploadImage(oversized))
      .rejects.toMatchObject({ status: 413, code: "IMAGE_TOO_LARGE" });
  });

  it("does not trust filename extension or declared MIME type", async () => {
    const disguisedText = new File(["not an image"], "looks-real.png", { type: "image/png" });

    await expect(uploadImage(disguisedText))
      .rejects.toMatchObject({ status: 400, code: "INVALID_IMAGE" });

    const unsupported = new File(["not an image"], "photo.heic", { type: "image/heic" });
    await expect(uploadImage(unsupported))
      .rejects.toMatchObject({ status: 400, code: "INVALID_IMAGE_TYPE" });
  });

  it("decodes a real image and strips it into the canonical WebP output", async () => {
    const png = await sharp({
      create: { width: 2, height: 3, channels: 4, background: { r: 75, g: 81, b: 43, alpha: 1 } },
    }).png().toBuffer();
    const uploaded = await uploadImage(new File([png], "herbs.png", { type: "image/png" }), { scope: "Products !!" });

    expect(uploaded).toMatchObject({
      url: "/images/catalog-placeholder.svg",
      pathname: null,
      storageProvider: "LOCAL",
      width: 2,
      height: 3,
      contentType: "image/webp",
    });
    expect(uploaded.size).toBeGreaterThan(0);
  });

  it("rejects decoded images beyond the configured pixel dimensions", async () => {
    const widePng = await sharp({
      create: { width: 4097, height: 1, channels: 3, background: { r: 255, g: 255, b: 255 } },
    }).png().toBuffer();

    await expect(uploadImage(new File([widePng], "wide.png", { type: "image/png" })))
      .rejects.toMatchObject({ status: 400, code: "IMAGE_DIMENSIONS_EXCEEDED" });
  });
});
