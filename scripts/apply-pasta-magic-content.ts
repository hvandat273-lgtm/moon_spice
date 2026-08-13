import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Catalog = {
  revision: number;
  updatedAt: string;
  settings: Record<string, unknown>;
  categories: Array<Record<string, unknown>>;
  products: Array<Record<string, unknown>>;
  productImages: Array<Record<string, unknown>>;
  productVariants: Array<Record<string, unknown>>;
  usageSuggestions: Array<Record<string, unknown>>;
  reviews: Array<Record<string, unknown>>;
};

const productId = "00000000-0000-4000-8000-000b00000001";
const categoryId = "00000000-0000-4000-8000-000a00000001";
const timestamp = "2026-08-12T00:00:00.000Z";

async function updateCatalog(relativePath: string) {
  const filename = path.resolve(relativePath);
  const catalog = JSON.parse(await readFile(filename, "utf8")) as Catalog;
  const sourceCategory = catalog.categories.find((category) => category.id === categoryId);
  const sourceProduct = catalog.products.find((product) => product.id === productId);
  const sourceVariant = catalog.productVariants.find((variant) => variant.productId === productId);
  if (!sourceCategory || !sourceProduct || !sourceVariant) throw new Error(`The showcase source is incomplete: ${relativePath}`);

  Object.assign(sourceCategory, {
    name: "パスタ用シーズニング",
    slug: "pasta-seasoning",
    description: "毎日のパスタを手軽に楽しむためのシーズニング。",
    imageAlt: "パスタマジックパウダーのイメージ",
    updatedAt: timestamp,
  });
  Object.assign(sourceProduct, {
    categoryId,
    name: "パスタマジックパウダー",
    slug: "pasta-magic-powder",
    shortDescription: "水・塩・パスタに、ひとさじ。家庭のキッチンから、イタリアの厨房へ。",
    description: "アーリオ・オーリオのために仕立てたパスタ用シーズニングです。乾燥ガーリック、唐辛子、パセリ、バジルの香りを生かし、ゆで汁とオリーブオイルで手軽に仕上げます。",
    ingredients: "ガーリックフレーク、ガーリックミンチ、唐辛子、パセリ、バジル、食塩、チキンコンソメ",
    usage: "1人前のパスタ100gに対してパスタマジックパウダー5gが目安です。ゆで汁大さじ3と合わせ、最後にエキストラバージンオリーブオイル15gを加えて仕上げます。",
    storageInstructions: "使用後は袋をしっかり密閉し、直射日光・高温多湿を避けて保存してください。賞味期限などはパッケージ表示を優先してください。",
    origin: "商品パッケージ表示をご確認ください",
    manufacturer: "Operation Factory",
    distributor: "Operation Factory",
    shelfLife: "商品パッケージ表示をご確認ください",
    allergenWarning: "チキンコンソメを使用しています。アレルギー情報は商品パッケージ表示をご確認ください。",
    nutritionInfo: "商品パッケージ表示をご確認ください。",
    bestSeller: true,
    active: true,
    updatedAt: timestamp,
  });
  delete sourceProduct.featured;
  Object.assign(sourceVariant, {
    sku: "PMP-050",
    weightGrams: 50,
    price: 0,
    originalPrice: null,
    stock: 0,
    active: true,
    updatedAt: timestamp,
  });

  catalog.categories = [sourceCategory];
  catalog.products = [sourceProduct];
  catalog.productVariants = [sourceVariant];
  catalog.productImages = catalog.productImages
    .filter((image) => image.productId === productId)
    .map((image) => ({
      ...image,
      alt: image.role === "INGREDIENT_SHOWCASE"
        ? "パスタマジックパウダーの原材料イメージ"
        : image.role === "USAGE"
          ? "パスタマジックパウダーの使い方"
          : image.alt ? "パスタマジックパウダーの商品イメージ" : "",
    }));
  catalog.usageSuggestions = catalog.usageSuggestions
    .filter((suggestion) => suggestion.productId === productId)
    .map((suggestion, index) => ({
      ...suggestion,
      title: ["アーリオ・オーリオに", "ゆで汁と合わせて", "オリーブオイルで仕上げ", "ひとさじで香り豊かに"][index] ?? "パスタに",
      description: null,
      active: true,
      updatedAt: timestamp,
    }));
  catalog.reviews = [];
  catalog.settings = {
    ...catalog.settings,
    heroProductId: productId,
    featuredProductId: productId,
    homepageBestSellerLimit: 1,
    announcementText: "MOOR SPICE 公式商品カタログ",
  };
  catalog.revision += 1;
  catalog.updatedAt = timestamp;
  await writeFile(filename, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
}

await Promise.all([updateCatalog(".data/catalog.json"), updateCatalog("data/showcase-catalog.json")]);
console.log("Pasta Magic Powder content applied to local and Render showcase catalogs.");
