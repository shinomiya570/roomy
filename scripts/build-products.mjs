#!/usr/bin/env node
// @ts-check
/**
 * Phase B: data/rakuten/manifest.json -> lib/data/products.ts
 *
 * docs/PROJECT_GUIDE.md の STEP 2.6 に基づき、楽天収集マニフェストから
 * EC サイトの商品データ (lib/data/products.ts) を自動生成する。
 *
 * - 既存の Product 型・ProductOption 型・ProductReview 型を維持する
 * - lib/data/products.ts が公開しているヘルパー関数群 (getProductById など、
 *   アプリ各所から import されている) をそのまま維持する
 * - products 配列のみをマニフェスト由来のデータで差し替える
 *
 * 実行: node scripts/build-products.mjs
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DEFAULT_MANIFEST_PATH = join(ROOT, "data", "rakuten", "manifest.json");

/** @returns {string} */
function resolveManifestPath() {
  const flagIndex = process.argv.indexOf("--manifest");
  if (flagIndex >= 0 && process.argv[flagIndex + 1]) {
    const raw = process.argv[flagIndex + 1];
    return resolve(ROOT, raw);
  }
  return DEFAULT_MANIFEST_PATH;
}

const MANIFEST_PATH = resolveManifestPath();
const OUTPUT_PATH = join(ROOT, "lib", "data", "products.ts");
const PUBLIC_DIR = join(ROOT, "public");

/** categories.ts に定義された有効な categorySlug */
const VALID_CATEGORY_SLUGS = new Set([
  "sofa",
  "table",
  "chair",
  "tvboard",
  "storage",
  "bed",
  "lighting",
  "rug",
  "goods",
  "kitchen",
  "clothing",
  "kotatsu",
  "mirror",
  "storagegoods",
  "objects",
]);
const DEFAULT_CATEGORY_SLUG = "goods";

/** カテゴリの日本語ラベル（説明文・素材の生成に使用） */
const CATEGORY_LABEL = {
  sofa: "ソファ",
  table: "テーブル・デスク",
  chair: "チェア・ベンチ",
  tvboard: "テレビボード",
  storage: "リビング収納",
  bed: "ベッド",
  lighting: "照明",
  rug: "ラグ・ファブリック",
  goods: "インテリア雑貨",
  kitchen: "キッチン収納",
  clothing: "衣類収納",
  kotatsu: "こたつ",
  mirror: "ミラー",
  storagegoods: "収納雑貨",
  objects: "置物・オブジェ",
};

/** カテゴリ別のデフォルト素材（商品名から抽出できなかった場合のフォールバック） */
const CATEGORY_MATERIAL = {
  sofa: "ファブリック／木製フレーム",
  table: "木製（天然木・木目調）",
  chair: "ファブリック／スチール脚",
  tvboard: "木製（木目調）",
  storage: "木製（木目調）",
  bed: "木製フレーム",
  lighting: "スチール／ファブリックシェード",
  rug: "ポリエステル・ウール混",
  goods: "陶器・木製・ガラス 等",
  kitchen: "木製／ステンレス天板",
  clothing: "木製（天然木・木目調）",
  kotatsu: "木製／こたつ布団付き",
  mirror: "ガラス／木製フレーム",
  storagegoods: "ラタン／木製／スチール",
  objects: "木製／陶器／真鍮",
};

/** 商品名に現れる素材キーワード（出現順に拾う） */
const MATERIAL_KEYWORDS = [
  "ステンレス", "セラミック", "天然木", "ウォールナット", "オーク", "パイン",
  "ラタン", "アイアン", "スチール", "アルミ", "ガラス", "本革", "レザー",
  "ファブリック", "リネン", "コットン", "ウール", "突板", "MDF", "大理石",
  "ひのき", "木製", "無垢",
];

/** 商品名から寸法情報を抽出する。 */
function extractSizeInfo(name, categorySlug) {
  const dims = [];
  const patterns = [
    /(?:約\s*)?幅\s*\d+(?:\.\d+)?\s*cm/gu,
    /(?:約\s*)?奥行き?\s*\d+(?:\.\d+)?\s*cm/gu,
    /(?:約\s*)?高さ\s*\d+(?:\.\d+)?\s*cm/gu,
    /[Ww]\s*\d+(?:\.\d+)?\s*[×xX]\s*[Dd]\s*\d+(?:\.\d+)?\s*[×xX]\s*[Hh]\s*\d+(?:\.\d+)?\s*(?:cm)?/gu,
    /\d+\s*[×xX]\s*\d+\s*cm/gu,
    /(?:直径|φ)\s*\d+(?:\.\d+)?\s*cm/gu,
  ];
  for (const re of patterns) {
    const found = name.match(re);
    if (found) dims.push(...found.map((s) => s.replace(/\s+/gu, "")));
  }
  const unique = [...new Set(dims)];
  if (unique.length > 0) return unique.join(" / ");
  return `${CATEGORY_LABEL[categorySlug] ?? "本商品"}のサイズは商品画像を目安にお選びください。`;
}

/** 商品名から素材を推定する。 */
function extractMaterial(name, categorySlug) {
  const hits = [];
  for (const kw of MATERIAL_KEYWORDS) {
    if (name.includes(kw) && !hits.includes(kw)) hits.push(kw);
    if (hits.length >= 3) break;
  }
  if (hits.length > 0) return hits.join("／");
  return CATEGORY_MATERIAL[categorySlug] ?? "木製";
}

/** 商品名とカテゴリから説明文を生成する。 */
function buildDescription(name, categorySlug) {
  const label = CATEGORY_LABEL[categorySlug] ?? "インテリア";
  return `${name}。${label}として、日々の暮らしになじむデザインと使い勝手を大切にした一台です。お部屋の雰囲気に合わせて取り入れやすく、長く愛用いただけます。`;
}

/**
 * 楽天 itemName を EC 向けの短い表示名に整形する。
 * @param {string} raw
 */
function cleanName(raw) {
  let name = String(raw ?? "").trim();
  name = name.replace(/^【楽天市場】\s*/u, "");
  name = name.replace(/【[^】]*】/gu, " ");
  name = name.replace(/\s+[A-Z]{2,}\d{3,}\s*$/u, "");
  name = name.replace(/[：:][^：:]*$/u, "").trim();
  name = name.replace(/\s+/gu, " ");
  if (name.length <= 36) return name || raw;

  const keyTerms = [
    "ワゴン", "本棚", "ラック", "シェルフ", "ソファ", "チェア", "テーブル",
    "ベッド", "キャビネット", "ボード", "棚", "収納", "ミラー", "照明",
  ];
  const picked = [];
  const seenTerms = new Set();

  for (const word of name.split(" ")) {
    const repeatTerm = keyTerms.find((term) => word.includes(term) && seenTerms.has(term));
    if (repeatTerm && picked.length >= 2) {
      const prefix = word.split(repeatTerm)[0].split("収納")[0].trim();
      if (prefix.length >= 2 && !picked.includes(prefix)) picked.push(prefix);
      break;
    }

    const candidate = [...picked, word].join(" ");
    if (candidate.length > 36 && picked.length > 0) break;

    picked.push(word);
    for (const term of keyTerms) {
      if (word.includes(term)) seenTerms.add(term);
    }
    if (picked.length >= 5) break;
  }

  return picked.join(" ") || name.slice(0, 36) || raw;
}

/**
 * @param {string} publicPath e.g. "/images/products/abr920125/01.jpg"
 */
function imageExists(publicPath) {
  if (typeof publicPath !== "string" || !publicPath.startsWith("/")) return false;
  return existsSync(join(PUBLIC_DIR, publicPath.replace(/^\//, "")));
}

function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(`manifest が見つかりません: ${MANIFEST_PATH}`);
  }
  const json = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  if (!Array.isArray(json.products)) {
    throw new Error("manifest.products が配列ではありません");
  }
  return json;
}

const DEFAULT_REVIEWS = [
  {
    id: "r1",
    author: "M.K さん",
    rating: 5,
    date: "2026.06.12",
    comment:
      "質感がよく、写真どおりの落ち着いた印象でした。組み立てもしやすく満足です。",
  },
  {
    id: "r2",
    author: "Y.S さん",
    rating: 4,
    date: "2026.06.08",
    comment: "サイズ感がちょうどよく、部屋になじみました。配送も丁寧でした。",
  },
];

const DEFAULT_COLORS = [
  { id: "natural", label: "ナチュラル", inStock: true },
  { id: "walnut", label: "ウォールナット", inStock: true },
  { id: "white", label: "ホワイト", inStock: true },
];

const DEFAULT_SIZES = [{ id: "free", label: "フリーサイズ", inStock: true }];

const DEFAULT_DELIVERY_NOTE =
  "ご注文確定後、通常5〜10営業日以内に発送（大型家具は別途納期をご案内）";

const SCENE_BY_CATEGORY = {
  sofa: ["living"],
  table: ["dining", "study"],
  chair: ["dining", "study"],
  tvboard: ["living"],
  storage: ["living", "study"],
  bed: ["bedroom"],
  lighting: ["living", "bedroom", "study"],
  rug: ["living", "bedroom"],
  goods: ["living"],
  kitchen: ["dining"],
  clothing: ["bedroom"],
  kotatsu: ["living"],
  mirror: ["living", "bedroom"],
  storagegoods: ["living", "bedroom"],
  objects: ["living", "bedroom"],
};

/**
 * manifest の 1 商品を Product オブジェクトへ変換する。
 * @param {Record<string, any>} item
 * @param {number} index manifest 内の順序（rank / 新着 / おすすめの付与に使用）
 */
function toProduct(item, warnings, index) {
  const id = String(item.id ?? "").trim();
  if (!id) {
    warnings.push(`id が無い商品をスキップしました: ${JSON.stringify(item).slice(0, 80)}`);
    return null;
  }

  const images = Array.isArray(item.images)
    ? item.images.filter((p) => typeof p === "string" && p.length > 0)
    : [];
  const existingImages = images.filter(imageExists);
  const missing = images.filter((p) => !imageExists(p));
  if (missing.length > 0) {
    warnings.push(`${id}: 画像ファイルが見つかりません -> ${missing.join(", ")}`);
  }
  if (existingImages.length === 0) {
    warnings.push(`${id}: 有効な画像が 0 枚のためスキップしました`);
    return null;
  }

  let categorySlug = String(item.categorySlug ?? "").trim();
  if (!VALID_CATEGORY_SLUGS.has(categorySlug)) {
    warnings.push(
      `${id}: 未知の categorySlug "${categorySlug}" -> "${DEFAULT_CATEGORY_SLUG}" にフォールバック`,
    );
    categorySlug = DEFAULT_CATEGORY_SLUG;
  }

  const rawPrice = Number(item.price);
  if (!Number.isFinite(rawPrice) || rawPrice <= 0) {
    warnings.push(`${id}: price が不正 (${item.price}) のためスキップしました`);
    return null;
  }
  const price = rawPrice;

  const name = cleanName(item.name);

  /** @type {Record<string, any>} */
  const product = {
    id,
    name,
    price,
    categorySlug,
    sceneSlugs: SCENE_BY_CATEGORY[categorySlug] ?? [],
    image: existingImages[0],
    images: existingImages.slice(0, 8),
    description: buildDescription(name, categorySlug),
    material: extractMaterial(name, categorySlug),
    sizeInfo: extractSizeInfo(name, categorySlug),
    deliveryNote: DEFAULT_DELIVERY_NOTE,
    colors: [],
    sizes: DEFAULT_SIZES,
    reviews: [],
  };

  product.rank =
    item.rank != null && Number.isFinite(Number(item.rank))
      ? Number(item.rank)
      : index + 1;

  // 新着とおすすめが同一商品にならないよう、先頭4件=新着 / 次の4件=おすすめ に分離
  if (index < 4) {
    product.isNew = true;
  } else if (index < 8) {
    product.isRecommended = true;
  }

  return product;
}

const FILE_HEADER = `// このファイルは scripts/build-products.mjs により自動生成されています。
// 手動で編集せず、data/rakuten/manifest.json を更新してから
//   node scripts/build-products.mjs
// を再実行してください。

export type ProductOption = {
  id: string;
  label: string;
  inStock: boolean;
};

export type ProductReview = {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  categorySlug: string;
  sceneSlugs: string[];
  image: string;
  images: string[];
  description: string;
  material: string;
  sizeInfo: string;
  deliveryNote: string;
  colors: ProductOption[];
  sizes: ProductOption[];
  reviews: ProductReview[];
  isNew?: boolean;
  isRecommended?: boolean;
  rank?: number;
};
`;

const FILE_FOOTER = `
export function formatPrice(price: number): string {
  return \`¥\${price.toLocaleString("ja-JP")}\`;
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return products
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, limit);
}

export function getAverageRating(product: Product): number {
  if (product.reviews.length === 0) return 0;
  const total = product.reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / product.reviews.length) * 10) / 10;
}

export function getNewArrivals(limit = 4): Product[] {
  const flagged = products.filter((p) => p.isNew);
  const source = flagged.length > 0 ? flagged : products;
  return source.slice(0, limit);
}

export function getAllNewArrivals(): Product[] {
  const flagged = products.filter((p) => p.isNew);
  return flagged.length > 0 ? flagged : products;
}

export type SearchFilters = {
  q?: string;
  category?: string;
  scene?: string;
  minPrice?: number;
  maxPrice?: number;
};

export function searchProducts(filters: SearchFilters): Product[] {
  const q = filters.q?.trim().toLowerCase() ?? "";

  return products.filter((product) => {
    if (filters.category && product.categorySlug !== filters.category) {
      return false;
    }
    if (filters.scene && !product.sceneSlugs.includes(filters.scene)) {
      return false;
    }
    const price = displayPrice(product);
    if (filters.minPrice != null && price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice != null && price > filters.maxPrice) {
      return false;
    }
    if (!q) return true;
    return (
      product.name.toLowerCase().includes(q) ||
      product.description.toLowerCase().includes(q) ||
      product.material.toLowerCase().includes(q)
    );
  });
}

export function getRecommended(limit = 4): Product[] {
  const flagged = products.filter((p) => p.isRecommended);
  const source = flagged.length > 0 ? flagged : products;
  return source.slice(0, limit);
}

export function getDefaultRankingCategory(): string {
  const slugs = [
    "storage",
    "sofa",
    "table",
    "chair",
    "tvboard",
    "bed",
    "lighting",
    "rug",
    "goods",
    "mirror",
    "storagegoods",
    "objects",
  ];
  for (const slug of slugs) {
    if (products.some((product) => product.categorySlug === slug)) {
      return slug;
    }
  }
  return products[0]?.categorySlug ?? "storage";
}

export function getRankingByCategory(categorySlug: string, limit = 4): Product[] {
  return products
    .filter((p) => p.categorySlug === categorySlug)
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    .slice(0, limit);
}

export type ProductSort = "recommended" | "price-asc" | "price-desc" | "new";

function displayPrice(product: Product): number {
  return product.salePrice ?? product.price;
}

export function getProductsByCategory(
  categorySlug: string,
  sort: ProductSort = "recommended",
): Product[] {
  const items = products.filter((p) => p.categorySlug === categorySlug);
  return sortProducts(items, sort);
}

export function getProductsByScene(
  sceneSlug: string,
  sort: ProductSort = "recommended",
): Product[] {
  const items = products.filter((p) => p.sceneSlugs.includes(sceneSlug));
  return sortProducts(items, sort);
}

function sortProducts(items: Product[], sort: ProductSort): Product[] {
  switch (sort) {
    case "price-asc":
      return [...items].sort((a, b) => displayPrice(a) - displayPrice(b));
    case "price-desc":
      return [...items].sort((a, b) => displayPrice(b) - displayPrice(a));
    case "new":
      return [...items].sort((a, b) => Number(b.isNew) - Number(a.isNew));
    case "recommended":
    default:
      return [...items].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  }
}
`;

function main() {
  const manifest = loadManifest();
  /** @type {string[]} */
  const warnings = [];

  const products = manifest.products
    .map((item, index) => toProduct(item, warnings, index))
    .filter((p) => p !== null);

  const productsLiteral = JSON.stringify(products, null, 2);
  const output = `${FILE_HEADER}\nexport const products: Product[] = ${productsLiteral};\n${FILE_FOOTER}`;

  writeFileSync(OUTPUT_PATH, output, "utf8");

  const totalImages = products.reduce((sum, p) => sum + p.images.length, 0);
  console.log(`Phase B 完了`);
  console.log(`- manifest 商品数: ${manifest.products.length}`);
  console.log(`- 生成商品数: ${products.length}`);
  console.log(`- 画像合計: ${totalImages} 枚`);
  console.log(`- 出力: ${OUTPUT_PATH.replace(ROOT + "/", "")}`);
  if (warnings.length > 0) {
    console.log(`- 警告 (${warnings.length} 件):`);
    for (const w of warnings) console.log(`  * ${w}`);
  } else {
    console.log(`- 警告: なし`);
  }
}

main();
