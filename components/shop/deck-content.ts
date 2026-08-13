/**
 * Chapter content, transcribed from the Pasta Magic Powder product deck
 * ("Operation Factory", 6 pages) and translated.
 *
 * The Japanese is the source text and is reproduced verbatim from the deck.
 * The English is a translation for the `en` locale — the product, the chef and
 * the sourced claims are described, never re-invented.
 *
 * Kept as data so the chapters stay presentational and the copy can be
 * reviewed in one place. `page` counters from the original deck are gone: the
 * chapter rail carries the numbering now, rather than restating it six times.
 */

import type { Locale } from "@/lib/i18n/config";

export interface ChapterMeta {
  /** Short English label, also used as the rail's accessible name. */
  label: string;
  title: string;
  subtitle: string;
}

export interface IngredientItem {
  name: string;
  /** Dot colour in the composition list. */
  swatch: string;
  /** Unpublished. Only rendered when `showFormulation` is turned on. */
  grams?: number;
}

/**
 * The deck page this comes from is stamped 関係者外秘 (internal only) and lists
 * the exact gram-by-gram formulation, so only the ingredient names — ordered by
 * weight, as food labelling requires — are published. Flip this to true (and
 * fill in `grams`) only if the exact blend is cleared for public release.
 */
export const showFormulation: boolean = false;

/** Swatch colours are locale-independent, so they live here once. */
const SWATCHES = ["#b08a4e", "#d3b478", "#b3341f", "#4f7a3c", "#2e4636", "#efe7d6", "#a16207"] as const;

function ingredients(names: readonly string[]): IngredientItem[] {
  return names.map((name, index) => ({ name, swatch: SWATCHES[index] }));
}

const ja = {
  chef: {
    meta: {
      label: "Chef Profile",
      title: "アル・ケッチァーノ 奥田政行シェフ",
      subtitle: "Masayuki Okuda ／ Chef of Al che-cciano",
    } satisfies ChapterMeta,
    lead: "“地産地消”の第一人者。山形・庄内から世界へ。",
    biography:
      "1969年、山形県鶴岡市生まれ。高校卒業後に上京し、イタリア料理・フランス料理・菓子製造を修業。26歳で帰郷し、ホテルの料理長などを経て、2000年「アル・ケッチァーノ」を独立開業。在来野菜や旬の地元食材を活かした料理で全国にファンを広げ、庄内地方を“食の都”として全国に知らしめた立役者。",
    portrait: {
      src: "/images/chef-okuda.webp",
      alt: "白いコックコート姿で店内に立つ奥田政行シェフ",
      caption: "山形県鶴岡市「アル・ケッチァーノ」",
    },
    highlightsLabel: "Career Highlights",
    highlights: [
      { year: "2000", text: "山形県鶴岡市にて『アル・ケッチァーノ』を開業" },
      { year: "2016", text: "ミラノ国際野菜料理大会に日本代表として参加" },
      { year: "2017", text: "「グルマン世界料理本大賞」食の遺産部門グランプリ受賞" },
    ],
  },

  yude: {
    meta: {
      label: "Yude Theory",
      title: "奥田シェフの「茹で論」",
      subtitle: "The Theory of Boiling – 一杯のパスタを決める、その一行。",
    } satisfies ChapterMeta,
    quote:
      "通常の倍以上の塩分濃度で茹で、ただのお湯で“ゆすぐ”。口の中で弾ける食感と、麺そのものの香りを引き出す独自理論。",
    columns: [
      {
        id: "general",
        kicker: "General",
        title: "一般的な茹で方",
        caption: "水1Lに塩10gが目安。",
        body: "多くのレシピが推奨する標準的な濃度。塩味は付くが、麺表面の締まりはおだやか。",
      },
      {
        id: "okuda",
        kicker: "Okuda Style",
        title: "奥田シェフの「茹で」",
        caption: "水1Lに対し塩25g／表面を“締めて”コシを生む。",
        body: "高濃度の塩湯で麺の表面を引き締め、口に入れた瞬間“ポンッ”と弾けるアルデンテに。",
      },
      {
        id: "finishing",
        kicker: "Finishing",
        title: "お湯で「ゆすぐ」",
        caption: "塩を足さない湯ですすぎ、塩味を調整。",
        body: "“茹で”と“ゆすぎ”で塩味とコシを別工程として最適化。世界でも例のない理論。",
      },
    ],
    source: "※ 出典：『料理王国』、アル・ケッチァーノ公式資料、奥田政行シェフ「茹で論」より構成。",
  },

  souvenir: {
    meta: {
      label: "Italian Souvenir",
      title: "イタリアの名物土産、「乾燥パスタの素」",
      subtitle: "Aglio, Olio e Peperoncino – 現地で愛される、ひとふりの魔法。",
    } satisfies ChapterMeta,
    note: "※ 本資料では「乾燥パスタの素」を、イタリアで定番のパスタ用スパイスミックス（乾燥タイプ）の意で使用しています。",
    lead: "本場イタリアで、最も親しまれているお土産。",
    body: "乾燥ニンニク、唐辛子、パセリ、バジル、塩などをイタリア本場の配合でブレンドした乾燥スパイスミックス。茹でたパスタにオリーブオイルとひとふりするだけで、本格的なアーリオ・オーリオ・ペペロンチーノが完成します。",
    image: {
      src: "/images/aglio-peperoncino.webp",
      alt: "イタリアで定番の乾燥スパイスミックス「アーリオ・ペペロンチーノ」のパッケージ",
      caption: "現地で売られている乾燥タイプのパスタ用スパイスミックス（参考商品）。",
    },
    features: [
      { index: "01", kicker: "Simple", title: "水・塩・オイルだけ", body: "特別な材料も、手の込んだソースも必要ありません。" },
      { index: "02", kicker: "Authentic", title: "本場の配合", body: "イタリアの食卓で親しまれてきた、定番のバランス。" },
      { index: "03", kicker: "Quick", title: "約10分で完成", body: "茹でる時間があれば、もう一皿ができあがります。" },
    ],
    proposalLabel: "Our Proposal",
    proposal: "この“現地の知恵”に、奥田シェフの「茹で論」を重ねた一本が パスタマジックパウダー です。",
  },

  method: {
    meta: {
      label: "How to Cook",
      title: "作り方 — 5ステップで完成",
      subtitle: "Recipe ／ 1人前",
    } satisfies ChapterMeta,
    equipmentLabel: "機材",
    equipment: ["茹麺用の鍋", "フライパン"],
    ingredientsLabel: "材料",
    ingredients: [
      { name: "水", amount: "1L", highlight: false },
      { name: "塩", amount: "10g", highlight: false },
      { name: "パスタ", amount: "100g", highlight: false },
      { name: "パスタマジックパウダー", amount: "5g", highlight: true },
      { name: "エクストラバージンオイル", amount: "15g", highlight: false },
    ],
    methodLabel: "Method ／ 作り方",
    steps: [
      { no: "01", text: "麺湯は水1Lに塩10gを入れて沸かす。" },
      { no: "02", text: "沸いたらパスタ100gを入れる。" },
      { no: "03", text: "フライパンにパスタマジックパウダー大さじ1（5g）と、麺湯を大さじ3（45g）を入れる。" },
      { no: "04", text: "パスタが茹で上がったら、フライパンの火をつけて沸かし、パスタを入れる。" },
      { no: "05", text: "ソースとパスタを和えたら、火を止めてエクストラバージンオイル大さじ1（15g）を入れて混ぜれば完成。" },
    ],
    tip: "※ 火を止めてからオイルを加えるのが、香りを最大限に活かすコツです。",
    recipeLink: "レシピページで詳しく見る",
  },

  ingredients: {
    meta: {
      label: "Ingredients",
      title: "パスタマジックパウダーの原材料",
      subtitle: "Ingredients ／ 50g（約10人前）",
    } satisfies ChapterMeta,
    stats: [
      { value: "50", unit: "g", label: "内容量" },
      { value: "10", unit: "人前", label: "約10人前" },
      { value: "5", unit: "g", label: "1人前あたり" },
    ],
    image: {
      src: "/images/ingredients.webp",
      alt: "ガーリック、唐辛子、バジル、乾燥パスタを並べたまな板",
      caption: "Aromatic herbs & spices, carefully blended.",
    },
    listLabel: "Composition ／ 重量順",
    items: ingredients([
      "ガーリックフレーク",
      "ガーリックミンス",
      "唐辛子",
      "パセリ",
      "バジル",
      "塩",
      "チキンコンソメ",
    ]),
    note: "※ 原材料は重量順に表示しています。配合比率は非公開です。実際の製造ロットにより風味に個体差が生じる場合があります。",
  },
} as const;

const en = {
  chef: {
    meta: {
      label: "Chef Profile",
      title: "Masayuki Okuda, chef of Al che-cciano",
      subtitle: "Tsuruoka, Yamagata",
    } satisfies ChapterMeta,
    lead: "A pioneer of local sourcing. From Shonai, Yamagata, to the world.",
    biography:
      "Born in Tsuruoka, Yamagata in 1969. He left for Tokyo after high school to train in Italian and French cooking and in confectionery, returned home at twenty-six, and after a period as a hotel head chef opened Al che-cciano in 2000. Cooking built on heirloom vegetables and seasonal local produce won him a following across Japan, and made him the figure most responsible for Shonai's reputation as a capital of food.",
    portrait: {
      src: "/images/chef-okuda.webp",
      alt: "Chef Masayuki Okuda standing in his restaurant in a white chef's jacket",
      caption: "Al che-cciano, Tsuruoka, Yamagata",
    },
    highlightsLabel: "Career Highlights",
    highlights: [
      { year: "2000", text: "Opens Al che-cciano in Tsuruoka, Yamagata" },
      { year: "2016", text: "Represents Japan at the Milan international vegetable cuisine competition" },
      { year: "2017", text: "Gourmand World Cookbook Awards — Grand Prix, food heritage" },
    ],
  },

  yude: {
    meta: {
      label: "Yude Theory",
      title: "Chef Okuda's theory of boiling",
      subtitle: "The Theory of Boiling – the one line that decides a plate of pasta.",
    } satisfies ChapterMeta,
    quote:
      "Boil at more than twice the usual salinity, then rinse in plain water. A method of his own, drawing out both a texture that bursts in the mouth and the aroma of the pasta itself.",
    columns: [
      {
        id: "general",
        kicker: "General",
        title: "The usual way",
        caption: "Around 10g of salt per litre of water.",
        body: "The standard most recipes call for. It seasons the pasta, but the surface stays soft.",
      },
      {
        id: "okuda",
        kicker: "Okuda Style",
        title: "Chef Okuda's boil",
        caption: "25g of salt per litre — the surface tightens, and body follows.",
        body: "Heavily salted water firms the surface of the pasta, giving an al dente that pops the moment it is eaten.",
      },
      {
        id: "finishing",
        kicker: "Finishing",
        title: "Rinsed in plain water",
        caption: "Rinsed in unsalted water to bring the seasoning back down.",
        body: "Boiling and rinsing become two separate stages, optimising salt and bite independently. Nothing else works quite this way.",
      },
    ],
    source: "Sources: Ryori Okoku, Al che-cciano official materials, and Chef Masayuki Okuda's writing on boiling.",
  },

  souvenir: {
    meta: {
      label: "Italian Souvenir",
      title: "Italy's favourite souvenir: dried pasta seasoning",
      subtitle: "Aglio, Olio e Peperoncino – a local magic, in one shake.",
    } satisfies ChapterMeta,
    note: "In this catalogue, “dried pasta seasoning” refers to the dried pasta spice mix that is a staple in Italy.",
    lead: "The souvenir most loved in Italy itself.",
    body: "A dried spice mix of garlic, chilli, parsley, basil and salt, blended the way it is blended in Italy. Shake it over cooked pasta with a little olive oil and a proper aglio e olio e peperoncino is finished.",
    image: {
      src: "/images/aglio-peperoncino.webp",
      alt: "A packet of aglio e peperoncino, the dried pasta spice mix sold across Italy",
      caption: "The dried pasta spice mix sold locally in Italy (shown for reference).",
    },
    features: [
      { index: "01", kicker: "Simple", title: "Water, salt, oil", body: "No special ingredients, and no sauce to build." },
      { index: "02", kicker: "Authentic", title: "The Italian ratio", body: "The balance that has been on Italian tables for generations." },
      { index: "03", kicker: "Quick", title: "Ready in about ten minutes", body: "If you have time to boil pasta, you have time for this." },
    ],
    proposalLabel: "Our Proposal",
    proposal: "Pasta Magic Powder is that local wisdom, with Chef Okuda's theory of boiling laid over the top.",
  },

  method: {
    meta: {
      label: "How to Cook",
      title: "The method — five steps",
      subtitle: "Recipe ／ one serving",
    } satisfies ChapterMeta,
    equipmentLabel: "Equipment",
    equipment: ["A pot for boiling", "A frying pan"],
    ingredientsLabel: "Ingredients",
    ingredients: [
      { name: "Water", amount: "1L", highlight: false },
      { name: "Salt", amount: "10g", highlight: false },
      { name: "Pasta", amount: "100g", highlight: false },
      { name: "Pasta Magic Powder", amount: "5g", highlight: true },
      { name: "Extra virgin olive oil", amount: "15g", highlight: false },
    ],
    methodLabel: "Method",
    steps: [
      { no: "01", text: "Boil 1L of water with 10g of salt." },
      { no: "02", text: "Add 100g of pasta to the boiling water." },
      { no: "03", text: "Combine 1 tbsp (5g) of pasta powder with 3 tbsp (45g) of pasta water in a pan." },
      { no: "04", text: "Bring the pan to a boil, then add the drained pasta." },
      { no: "05", text: "Toss, take the pan off the heat, stir in 1 tbsp (15g) of extra virgin olive oil and serve." },
    ],
    tip: "Adding the oil off the heat is what keeps the aroma at its fullest.",
    recipeLink: "See the full recipe",
  },

  ingredients: {
    meta: {
      label: "Ingredients",
      title: "What is in Pasta Magic Powder",
      subtitle: "Ingredients ／ 50g (about 10 servings)",
    } satisfies ChapterMeta,
    stats: [
      { value: "50", unit: "g", label: "Net weight" },
      { value: "10", unit: "servings", label: "About 10 servings" },
      { value: "5", unit: "g", label: "Per serving" },
    ],
    image: {
      src: "/images/ingredients.webp",
      alt: "Garlic, chilli, basil and dried pasta laid out on a board",
      caption: "Aromatic herbs & spices, carefully blended.",
    },
    listLabel: "Composition ／ by weight",
    items: ingredients([
      "Garlic flakes",
      "Minced garlic",
      "Chilli",
      "Parsley",
      "Basil",
      "Salt",
      "Chicken consommé",
    ]),
    note: "Ingredients are listed in order of weight. The exact ratio is not published, and flavour can vary slightly between production batches.",
  },
} as const;

/**
 * `en` is typed against `ja`, so a chapter that gains a field in Japanese and
 * not in English is a compile error rather than a gap that only shows up when
 * someone switches language on that one chapter.
 */
export type ChapterContent = typeof ja;

export const chapterContent: Record<Locale, ChapterContent> = {
  ja,
  en: en as unknown as ChapterContent,
};

/**
 * The salinity meters read as a fraction of the 2.5% peak. Locale-independent,
 * and kept next to the columns they drive rather than duplicated per language.
 */
export const SALINITY_FILL: Record<string, number> = {
  general: 0.4,
  okuda: 1,
  finishing: 0,
};

/** Percentage figures, shown identically in both languages. */
export const SALINITY_VALUE: Record<string, { value: string; unit: string }> = {
  general: { value: "1.0", unit: "%" },
  okuda: { value: "2.5", unit: "%" },
  finishing: { value: "0", unit: "%" },
};
