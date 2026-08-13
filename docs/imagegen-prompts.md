# MOOR SPICE image generation prompts

Mode: built-in ImageGen (`image_gen`), with the user-provided website screenshot used as a style/composition reference and the user-provided office product photo used as the product identity reference.

## Hero canvas

```text
Use case: compositing
Asset type: premium ecommerce landing-page hero canvas, wide 16:9
Input images: Image 1 is the website composition/style reference only; Image 2 is the product photo and the exact product package to preserve.
Primary request: Create a polished photorealistic Japanese premium spice hero scene that matches Image 1's warm cream, olive-green, artisanal food-photography mood. Remove the desk, keyboard, pen, and office background from Image 2. Place the same physical kraft stand-up spice pouch upright as the central hero product, photographed front-on with convincing scale and clean edges. Preserve the pouch shape, transparent window, visible herb-and-garlic contents, zipper, material texture, label layout, logo, and all existing label text as faithfully as possible; do not redesign or replace the package.
Scene/backdrop: softly lit warm ivory kitchen-table scene; blurred bowl of herb pasta on the right; one whole garlic bulb, a few cloves, rosemary/olive sprigs and a restrained scattering of spices near the bottom; softly blurred foliage in the far background.
Composition/framing: product centered slightly right of center; generous calm negative space across the left 38% for live Japanese HTML copy and CTA; full pouch visible and uncropped; food stays on the right and does not overlap the package.
Lighting/mood: soft natural window light, gentle golden highlights, refined Japanese catalog photography, subtle depth of field, premium but authentic.
Color palette: ivory, kraft beige, muted olive, deep herb green, restrained burgundy accents only from the real label.
Constraints: no website UI, no buttons, no badges, no added captions, no floating text, no watermark; do not copy any text or logo from Image 1; do not invent extra packaging; preserve the Image 2 product identity; keep the left copy area low-detail and readable.
```

## Product packshot

```text
Use case: precise-object-edit
Asset type: ecommerce product packshot for responsive website cards and mobile hero, portrait 4:5
Input images: the office snapshot showing the real kraft spice pouch is the edit target; the polished hero scene is only a lighting/quality reference.
Primary request: Remove the keyboard, pen, desk, glare, and office setting from the real product snapshot. Create a clean, premium front-facing catalog photograph of that exact same MOOR SPICE kraft stand-up pouch on a seamless warm ivory (#F6F0E5) studio background.
Subject: one full pouch only, upright and centered, zipper and all package edges visible, transparent window and actual herb/garlic contents visible, pouch proportions unchanged.
Lighting/mood: soft diffused catalog light with a very subtle natural grounding shadow directly beneath the pouch; accurate kraft paper and clear plastic texture.
Composition/framing: vertical portrait, full product uncropped, generous even margin on all sides, package occupies about 76% of canvas height.
Constraints: preserve the real label layout, MOOR SPICE logo, Japanese product name, company line and all existing label text as faithfully and legibly as possible; no redesign, no new text, no ingredients outside the pouch, no props, no hands, no badge, no watermark, no extra package, no dramatic reflection.
```

## Olive featured banner

```text
Use case: compositing
Asset type: wide ecommerce featured-product banner background, panoramic 4:1
Input images: use the clean portrait MOOR SPICE packshot as the exact product identity to preserve; use the warm hero scene only as a quality and lighting reference.
Primary request: Create a premium photorealistic wide banner on a deep muted olive-green Italian kitchen backdrop. Integrate the exact same kraft MOOR SPICE pouch naturally into the scene, standing upright on a dark rustic wooden surface at about 68% of canvas width.
Scene/backdrop: olive plaster wall with subtle texture; dark wood tabletop; restrained olive and rosemary branches, one garlic bulb and a small ceramic bowl of the same herb blend on the far right; elegant, uncluttered.
Composition/framing: panoramic; leave the left 48% dark, low-detail, and empty for live white Japanese HTML copy and purchase controls; full pouch visible and uncropped on the center-right; props stay on the far right; product is the visual focus.
Lighting/mood: soft directional studio light from upper left, rich olive and warm kraft tones, authentic Japanese premium food catalog photography, natural contact shadow.
Constraints: preserve the pouch shape, zipper, clear window, real herb-and-garlic contents, label layout, MOOR SPICE logo, Japanese product name, company line and existing label text as faithfully as possible; no cream or white rectangular panel around the pouch; no added text outside the real label; no UI, no button, no badge, no watermark, no extra package.
```

Final correction applied to the generated featured banner:

```text
Use case: precise-object-edit
Asset type: final ecommerce featured-product banner
Input images: Image 1 is the generated olive MOOR SPICE banner and is the edit target.
Primary request: Remove only the dark green circular sticker/badge attached to the upper-left area of the pouch window. Reconstruct the pouch's clear plastic window and the real visible garlic-and-herb contents naturally underneath that circle.
Constraints: change only the circular sticker area; keep the pouch shape, zipper, kraft material, real white label, MOOR SPICE logo, Japanese product text, product position, scale, lighting, shadows, olive background, wood surface, garlic, bowl, rosemary, framing and all other pixels unchanged; do not add or change any text; no new badge, no watermark.
```
