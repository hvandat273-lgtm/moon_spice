/**
 * Builds the art the hero's WebGL stage samples.
 *
 * Run once and commit the output:
 *   npm run art:build
 *
 * Two problems with the source packshot make it unusable for a lit 3D stage,
 * and both are fixed here rather than in the shader:
 *
 * 1. The previous cut-out had a BINARY matte — every pixel was either fully
 *    opaque or fully transparent, measured at 0 partially-transparent pixels
 *    and 3503 hard edge pixels. That is why the pouch read as pasted on, and a
 *    moving light would only sharpen the staircase. The matte below is a
 *    continuous ramp: the background is found by connectivity (so the white
 *    label in the middle of the pouch is never mistaken for background), then
 *    the mask is blurred to produce a genuine anti-aliased edge.
 *
 * 2. Edge pixels in the source are physically blended with the cream studio
 *    background, so on a near-black stage they glow. Each partially
 *    transparent pixel is un-multiplied against the measured background colour
 *    to recover its true colour.
 *
 * The normal map gives the shader a surface to light. Without it a "light"
 * is just a bright smear sliding across a flat photograph.
 */

import path from "node:path";
import sharp from "sharp";

const SOURCE = path.join(process.cwd(), "public/images/moor-spice-packshot-v2.webp");
const OUT_DIR = path.join(process.cwd(), "public/images");

/** Colour distance at which a pixel stops looking like the studio background. */
const FLOOD_TOLERANCE = 30;
/** Edge softness in pixels. Below ~1 the staircase returns; above ~2 it smears. */
const FEATHER = 1.4;
/** How pronounced the surface relief reads under the moving light. */
const NORMAL_STRENGTH = 2.6;

function medianCornerColour(data: Buffer, width: number, height: number, channels: number) {
  const samples: Array<[number, number, number]> = [];
  const patch = 8;
  for (const [ox, oy] of [
    [0, 0],
    [width - patch, 0],
    [0, height - patch],
    [width - patch, height - patch],
  ]) {
    for (let y = 0; y < patch; y += 1) {
      for (let x = 0; x < patch; x += 1) {
        const i = ((oy + y) * width + (ox + x)) * channels;
        samples.push([data[i], data[i + 1], data[i + 2]]);
      }
    }
  }
  const median = (k: 0 | 1 | 2) => {
    const sorted = samples.map((s) => s[k]).sort((a, b) => a - b);
    return sorted[sorted.length >> 1];
  };
  return [median(0), median(1), median(2)] as const;
}

/**
 * Marks every pixel reachable from the border that still looks like the studio
 * background. Connectivity is what protects the interior: the label is close
 * to the background in colour but is walled in by the pouch, so it is never
 * reached.
 */
function floodBackground(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  bg: readonly [number, number, number],
) {
  const mask = new Uint8Array(width * height);
  const stack: number[] = [];
  const distance = (i: number) =>
    Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]);

  for (let x = 0; x < width; x += 1) {
    stack.push(x, 0, x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    stack.push(0, y, width - 1, y);
  }

  while (stack.length) {
    const y = stack.pop() as number;
    const x = stack.pop() as number;
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const p = y * width + x;
    if (mask[p]) continue;
    if (distance((y * width + x) * channels) > FLOOD_TOLERANCE) continue;
    mask[p] = 255;
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }
  return mask;
}

async function buildMatte() {
  const { data, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const bg = medianCornerColour(data, width, height, channels);
  const mask = floodBackground(data, width, height, channels, bg);

  // Blurring the binary mask IS the anti-aliasing: it turns a hard boundary
  // into a ramp a pixel and a half wide.
  //
  // The channel count of the result is read back rather than assumed: sharp
  // does not guarantee a one-channel input comes back as one channel, and
  // indexing a three-channel buffer with a one-channel stride produces a
  // banded matte that looks like scanlines across the product.
  const { data: soft, info: softInfo } = await sharp(Buffer.from(mask), {
    raw: { width, height, channels: 1 },
  })
    .blur(FEATHER)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const softStride = softInfo.channels;

  const out = Buffer.alloc(width * height * 4);
  let feathered = 0;
  for (let p = 0; p < width * height; p += 1) {
    const alpha = 255 - soft[p * softStride];
    const src = p * channels;
    const dst = p * 4;

    if (alpha === 0) {
      out[dst] = out[dst + 1] = out[dst + 2] = out[dst + 3] = 0;
      continue;
    }

    if (alpha < 250) {
      feathered += 1;
      // Un-premultiply against the studio background so the recovered colour
      // is the pouch's own, not the pouch blended with cream.
      const a = alpha / 255;
      for (let c = 0; c < 3; c += 1) {
        const recovered = (data[src + c] - (1 - a) * bg[c]) / a;
        out[dst + c] = Math.max(0, Math.min(255, Math.round(recovered)));
      }
    } else {
      out[dst] = data[src];
      out[dst + 1] = data[src + 1];
      out[dst + 2] = data[src + 2];
    }
    out[dst + 3] = alpha;
  }

  await sharp(out, { raw: { width, height, channels: 4 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(path.join(OUT_DIR, "packshot-matte.webp"));

  return { width, height, bg, feathered };
}

/** Sobel over a blurred luminance channel, packed as a tangent-space normal. */
async function buildNormalMap() {
  const { data, info } = await sharp(SOURCE)
    .greyscale()
    .blur(1.1)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const at = (x: number, y: number) =>
    data[Math.min(height - 1, Math.max(0, y)) * width + Math.min(width - 1, Math.max(0, x))] / 255;

  const out = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx =
        at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1) -
        (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1));
      const dy =
        at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1) -
        (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1));

      const nx = dx * NORMAL_STRENGTH;
      const ny = dy * NORMAL_STRENGTH;
      const length = Math.hypot(nx, ny, 1);
      const i = (y * width + x) * 3;
      out[i] = Math.round(((nx / length) * 0.5 + 0.5) * 255);
      out[i + 1] = Math.round(((ny / length) * 0.5 + 0.5) * 255);
      out[i + 2] = Math.round((1 / length) * 255);
    }
  }

  await sharp(out, { raw: { width, height, channels: 3 } })
    .webp({ quality: 82 })
    .toFile(path.join(OUT_DIR, "packshot-normal.webp"));

  return { width, height };
}

async function main() {
  const matte = await buildMatte();
  const normal = await buildNormalMap();
  const total = matte.width * matte.height;
  console.log(`background  rgb(${matte.bg.join(", ")})`);
  console.log(`matte       ${matte.width}x${matte.height}, ${matte.feathered} feathered edge pixels (${((100 * matte.feathered) / total).toFixed(2)}%)`);
  console.log(`normal map  ${normal.width}x${normal.height}`);
  console.log("wrote public/images/packshot-matte.webp and packshot-normal.webp");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
