import type { Category, Product, ProductImage, ProductVariant, Review, UsageSuggestion } from "@/types/domain";

const demoUuid = (namespace: number, index: number) =>
  `00000000-0000-4000-8000-${namespace.toString(16).padStart(4, "0")}${index.toString(16).padStart(8, "0")}`;

const pouch = "/images/moor-spice-packshot-v2.webp";
const commonImages: ProductImage[] = [
  { id: demoUuid(1, 1), url: pouch, alt: "MOOR SPICE イタリアンスパイスのパッケージ", role: "GALLERY", isPrimary: true },
  { id: demoUuid(1, 2), url: pouch, alt: "MOOR SPICE ハーブスパイス", role: "HERO_CUTOUT" },
  { id: demoUuid(1, 3), url: "/images/moor-spice-hero-v2.webp", alt: "", role: "HERO_BACKGROUND", focalX: 54, focalY: 50 },
  { id: demoUuid(1, 4), url: "/images/moor-spice-featured-v2.webp", alt: "", role: "FEATURED_BACKGROUND", focalX: 68, focalY: 50 },
  { id: demoUuid(1, 5), url: "/images/ingredients.webp", alt: "ハーブ、ガーリック、胡椒、唐辛子", role: "INGREDIENT_SHOWCASE" }
];

const variants = (prefix: string, basePrice: number, productIndex: number): ProductVariant[] => [
  { id: demoUuid(20 + productIndex, 1), sku: `${prefix}-050`, weightGrams: 50, price: basePrice, originalPrice: null, stock: 24, active: true, version: 1 },
  { id: demoUuid(20 + productIndex, 2), sku: `${prefix}-100`, weightGrams: 100, price: basePrice * 18 / 10, originalPrice: basePrice * 2, stock: 16, active: true, version: 1 },
  { id: demoUuid(20 + productIndex, 3), sku: `${prefix}-200`, weightGrams: 200, price: basePrice * 32 / 10, originalPrice: basePrice * 36 / 10, stock: 8, active: true, version: 1 }
].map((variant) => ({ ...variant, price: Math.round(variant.price / 1000) * 1000, originalPrice: variant.originalPrice ? Math.round(variant.originalPrice / 1000) * 1000 : null }));

const demoReviews: Review[] = [
  { id: demoUuid(2, 1), customerName: "東京都／40代", rating: 5, content: "風味がとても良く、どんな料理にも合います。パスタが一気にお店の味になりました。", reviewedAt: "2026-07-28", approved: true, source: "DEMO" },
  { id: demoUuid(2, 2), customerName: "愛知県／30代", rating: 5, content: "ガーリックの香りが食欲をそそります。リピート決定です。", reviewedAt: "2026-07-19", approved: true, source: "DEMO" },
  { id: demoUuid(2, 3), customerName: "大阪府／50代", rating: 4, content: "サラダやスープに振りかけるだけで、本格的な味わいになります。", reviewedAt: "2026-07-08", approved: true, source: "DEMO" }
];

const usageImage = "/images/usage-grid.webp";
const usageSuggestions: UsageSuggestion[] = ["パスタに", "グリルチキンに", "サラダのトッピングに", "野菜炒めに"].map((title, index) => ({
  id: demoUuid(3, index + 1),
  title,
  sortOrder: index,
  image: { id: demoUuid(4, index + 1), url: usageImage, alt: title, role: "USAGE", focalX: index % 2 ? 75 : 25, focalY: index > 1 ? 75 : 25 }
}));

export const categories: Category[] = [
  [demoUuid(10, 1), "イタリアンスパイス", "gia-vi-y", "パスタ、ピザ、グリル料理に合うハーブブレンド。"],
  [demoUuid(10, 2), "BBQスパイス", "gia-vi-bbq", "香ばしいグリル料理のための力強いブレンド。"],
  [demoUuid(10, 3), "ミートスパイス", "gia-vi-thit", "肉料理や鶏料理に使いやすいバランスの良い味わい。"],
  [demoUuid(10, 4), "シーフードスパイス", "gia-vi-hai-san", "魚介の旨みを引き立てる爽やかな香り。"],
  [demoUuid(10, 5), "ソルト＆ペッパー", "muoi-tieu", "毎日の料理に欠かせないベーシックな調味料。"],
  [demoUuid(10, 6), "ギフトセット", "combo", "キッチンで使いやすいスパイスセット。"]
].map(([id, name, slug, description], sortOrder) => ({ id, name, slug, description, imageUrl: sortOrder % 2 ? "/images/usage-grid.webp" : "/images/ingredients.webp", imageAlt: name, active: true, sortOrder }));

const productSpecs = [
  [demoUuid(11, 1), "イタリアンスパイス OF NO3（乾杯）", "italian-herb-spice", "イタリアンスパイス", "ITL", 79000, "ハーブとガーリックの香り豊かな本格イタリアンブレンド。", "ガーリック、バジル、オレガノ、パセリ、赤唐辛子、ブラックペッパー、ローズマリー、食塩 ほか"],
  [demoUuid(11, 2), "ガーリックハーブミックス", "garlic-herb-mix", "イタリアンスパイス", "GAR", 72000, "香ばしいガーリックとハーブを合わせた、グリル料理に使いやすいブレンド。", "乾燥ガーリック、パセリ、タイム、ブラックペッパー"],
  [demoUuid(11, 3), "スモーキーBBQシーズニング", "smoky-bbq-seasoning", "BBQスパイス", "BBQ", 85000, "スモーキーな香りと、塩味・甘味・穏やかな辛味のバランス。", "パプリカ、ガーリック、胡椒、クミン、ブラウンシュガー"],
  [demoUuid(11, 4), "チリガーリック", "chili-garlic", "ミートスパイス", "CHL", 69000, "炒め物やグリル、ソースに合う唐辛子とガーリックの力強い味わい。", "乾燥唐辛子、乾燥ガーリック、胡椒、食塩"],
  [demoUuid(11, 5), "ブラックペッパーミックス", "black-pepper-mix", "ソルト＆ペッパー", "PEP", 76000, "香り高いローストペッパーとドライハーブのブレンド。", "ブラックペッパー、ホワイトペッパー、ローズマリー、タイム"],
  [demoUuid(11, 6), "ローズマリーソルト", "rosemary-salt", "ソルト＆ペッパー", "ROS", 65000, "じゃがいも、野菜、グリル肉に手軽に使えるハーブソルト。", "海塩、ローズマリー、ガーリック"],
  [demoUuid(11, 7), "シーフードシーズニング", "seafood-seasoning", "シーフードスパイス", "SEA", 82000, "魚や海老などの魚介に合う、レモンとハーブの爽やかな香り。", "ディル、パセリ、胡椒、乾燥レモンピール、ガーリック"],
  [demoUuid(11, 8), "ステーキシーズニング", "steak-seasoning", "ミートスパイス", "STK", 89000, "胡椒、ガーリック、ハーブでステーキの表面を香ばしく仕上げます。", "ブラックペッパー、ガーリック、ローズマリー、海塩、パプリカ"]
] as const;

export const products: Product[] = productSpecs.map(([id, name, slug, categoryName, prefix, price, shortDescription, ingredients], index) => {
  const category = categories.find((item) => item.name === categoryName) ?? categories[0];
  const isPrimary = index === 0;
  return {
    id,
    categoryId: category.id,
    categoryName,
    name,
    slug,
    shortDescription,
    description: `${shortDescription} 香りを大切に少量ずつ丁寧にブレンドし、毎日のキッチンで使いやすく仕上げています。`,
    ingredients,
    usage: "調理前または仕上げにそのまま振りかけ、味を見ながら量を調整してください。",
    storageInstructions: "使用後はしっかり密閉し、直射日光・高温多湿を避けて保存してください。",
    origin: "ベトナム",
    shelfLife: "製造日より12か月",
    bestSeller: index < 4,
    active: true,
    images: isPrimary ? commonImages : commonImages.slice(0, 2).map((image, imageIndex) => ({ ...image, id: demoUuid(40 + index, imageIndex + 1) })),
    variants: variants(prefix, price, index),
    usageSuggestions: isPrimary ? usageSuggestions : [],
    reviews: isPrimary ? demoReviews : []
  };
});

export const heroProduct = products[0];
export const featuredProduct = products[0];
