import type { Locale } from "@/lib/i18n/config";

export interface Recipe {
  slug: string;
  title: string;
  description: string;
  heroImage: string;
  heroAlt: string;
  imagePosition: string;
  prepMinutes: number;
  servings: number;
  spiceSlug: string;
  ingredients: string[];
  steps: string[];
}

/**
 * Confirmed preparation guidance supplied with Pasta Magic Powder.
 *
 * The Japanese is the source text and is reproduced verbatim; the English is a
 * translation of the same guidance, with the quantities untouched.
 */
const ja: Recipe[] = [
  {
    slug: "pasta-magic-aglio-olio",
    title: "パスタマジックパウダーで作るアーリオ・オーリオ",
    description: "水・塩・パスタと、ひとさじのパスタマジックパウダーで仕上げる、シンプルな一皿です。",
    heroImage: "/images/moor-spice-hero-v2.webp",
    heroAlt: "パスタマジックパウダーを使ったアーリオ・オーリオのイメージ",
    imagePosition: "center",
    prepMinutes: 10,
    servings: 1,
    spiceSlug: "pasta-magic-powder",
    ingredients: [
      "水 1L",
      "塩 10g",
      "パスタ 100g",
      "パスタマジックパウダー 5g",
      "エキストラバージンオリーブオイル 15g"
    ],
    steps: [
      "鍋に水1Lと塩10gを入れて沸騰させます。",
      "沸騰したらパスタ100gを入れ、表示時間を目安にゆでます。",
      "フライパンにパスタマジックパウダー5gと、ゆで汁大さじ3（約45g）を入れます。",
      "パスタがゆで上がったらフライパンを火にかけ、パスタを加えて全体をからめます。",
      "火を止めてエキストラバージンオリーブオイル15gを加え、なめらかになるまで混ぜて完成です。"
    ]
  }
];

const en: Recipe[] = [
  {
    slug: "pasta-magic-aglio-olio",
    title: "Aglio e olio with Pasta Magic Powder",
    description: "Water, salt, pasta and one spoonful of Pasta Magic Powder — a plate built from almost nothing.",
    heroImage: "/images/moor-spice-hero-v2.webp",
    heroAlt: "Aglio e olio made with Pasta Magic Powder",
    imagePosition: "center",
    prepMinutes: 10,
    servings: 1,
    spiceSlug: "pasta-magic-powder",
    ingredients: [
      "Water 1L",
      "Salt 10g",
      "Pasta 100g",
      "Pasta Magic Powder 5g",
      "Extra virgin olive oil 15g"
    ],
    steps: [
      "Bring 1L of water and 10g of salt to the boil.",
      "Add 100g of pasta and cook for the time given on the packet.",
      "In a frying pan, combine 5g of Pasta Magic Powder with 3 tbsp (about 45g) of the cooking water.",
      "When the pasta is done, put the pan on the heat, add the pasta and toss to coat.",
      "Take the pan off the heat, add 15g of extra virgin olive oil and stir until glossy."
    ]
  }
];

export const recipesByLocale: Record<Locale, Recipe[]> = { ja, en };

/** Slugs are locale-independent, so `generateStaticParams` can read them
 * without picking a language. */
export const recipeSlugs = ja.map((recipe) => recipe.slug);
