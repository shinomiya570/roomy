// @ts-check
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** @typedef {{ id: string; name: string; price: number; salePrice?: number; categorySlug: string; image: string; images: string[]; rank?: number; isRecommended?: boolean; isNew?: boolean }} PamphletProduct */

export const BRAND = {
  shopName: "roomy",
  catchcopy: "暮らしに、心地いい居場所を。",
  tagline: "利用シーンから探す、家具・インテリアのセレクトショップ",
  story:
    "roomy（ルーミー）は、新生活や模様替えのタイミングで「部屋づくりの最初の1歩」を提案する家具・インテリアのセレクトショップです。大型家具から小物までを一つの棚に集約し、リビング・ダイニング・寝室・書斎の4つのシーンから、失敗しない選び方でお届けします。",
  storyQuote: "好きなものに囲まれた、自分らしい空間を。",
  storyScenes: [
    { name: "リビング", note: "くつろぎの拠点" },
    { name: "ダイニング", note: "食卓を囲む時間" },
    { name: "寝室", note: "やすらぎの休息" },
    { name: "書斎", note: "集中できる空間" },
  ],
  strengths: [
    {
      title: "シーンから探せる",
      body: "リビング・ダイニング・寝室・書斎の4シーン別に、部屋づくりに必要なアイテムをセレクト。",
    },
    {
      title: "選びやすい品揃え",
      body: "厳選した約100点。迷いすぎない、ちょうどいいラインナップでご提案します。",
    },
    {
      title: "安心のサポート",
      body: "送料・返品条件を明示。お問い合わせ窓口から、購入前後の不安にも丁寧にお応えします。",
    },
  ],
  colors: {
    bg: "#faf8f5",
    panel: "#f1ede7",
    cover: "#3d3d3d",
    text: "#3a3a3a",
    muted: "#6b6b6b",
    accent: "#c97c5d",
    accent2: "#8a9a7e",
    white: "#ffffff",
  },
};

export const CATEGORIES = [
  { slug: "sofa", name: "ソファ" },
  { slug: "table", name: "テーブル" },
  { slug: "chair", name: "チェア" },
  { slug: "tvboard", name: "TVボード" },
  { slug: "storage", name: "収納" },
  { slug: "kitchen", name: "キッチン" },
  { slug: "clothing", name: "衣類収納" },
  { slug: "kotatsu", name: "こたつ" },
  { slug: "bed", name: "ベッド" },
  { slug: "lighting", name: "照明" },
  { slug: "rug", name: "ラグ" },
  { slug: "goods", name: "雑貨" },
];

export const SCENES = [
  { slug: "living", name: "リビング" },
  { slug: "dining", name: "ダイニング・キッチン" },
  { slug: "bedroom", name: "寝室" },
  { slug: "study", name: "書斎・オフィス" },
];

export const COMPANY = {
  name: "フォースペース合同会社",
  email: "shinomiya@roomy-right.com",
  phone: "050-1784-9859",
  hours: "平日 10:00〜17:00（土日祝休）",
  shipping: "22,000円（税込）以上で送料無料",
};

/**
 * @param {string} root
 * @returns {PamphletProduct[]}
 */
export function loadProducts(root) {
  const filePath = join(root, "lib", "data", "products.ts");
  const text = readFileSync(filePath, "utf8");
  const marker = "export const products: Product[] = ";
  const start = text.indexOf(marker);
  if (start < 0) {
    throw new Error("products.ts から products 配列が見つかりません");
  }
  const arrayStart = start + marker.length;
  const funcIndex = text.indexOf("export function formatPrice");
  const closing = text.lastIndexOf("];", funcIndex);
  if (closing < arrayStart) {
    throw new Error("products 配列の範囲を特定できません");
  }
  return JSON.parse(text.slice(arrayStart, closing + 1));
}

/**
 * @param {number} price
 * @returns {string}
 */
export function formatPrice(price) {
  return `¥${price.toLocaleString("ja-JP")}`;
}

/**
 * @param {PamphletProduct} product
 * @returns {string}
 */
export function productDisplayPrice(product) {
  return formatPrice(product.salePrice ?? product.price);
}

/**
 * @param {PamphletProduct[]} products
 * @param {string} categorySlug
 * @param {number} [index]
 * @returns {PamphletProduct | undefined}
 */
export function pickByCategory(products, categorySlug, index = 0) {
  const sorted = products
    .filter((p) => p.categorySlug === categorySlug)
    .sort((a, b) => {
      const rankA = a.rank ?? 999;
      const rankB = b.rank ?? 999;
      if (rankA !== rankB) return rankA - rankB;
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return a.price - b.price;
    });
  return sorted[index];
}

/**
 * @param {PamphletProduct[]} products
 * @param {string[]} categorySlugs
 * @returns {PamphletProduct[]}
 */
export function pickFeaturedProducts(products, categorySlugs) {
  return categorySlugs.map((slug, i) => {
    const picked = pickByCategory(products, slug, 0);
    if (!picked) {
      throw new Error(`カテゴリ "${slug}" の商品が見つかりません`);
    }
    return picked;
  });
}

/**
 * @param {PamphletProduct[]} products
 * @param {string} id
 * @returns {PamphletProduct}
 */
export function pickProductById(products, id) {
  const product = products.find((p) => p.id === id);
  if (!product) {
    throw new Error(`商品 "${id}" が見つかりません`);
  }
  return product;
}

/**
 * @param {PamphletProduct[]} products
 * @returns {PamphletProduct}
 */
export function pickHeroProduct(products) {
  return (
    pickByCategory(products, "sofa", 0) ??
    products.find((p) => p.isRecommended) ??
    products[0]
  );
}

/**
 * @param {PamphletProduct} product
 * @returns {string}
 */
export function shortProductName(product) {
  const name = product.name.trim();
  if (name.length <= 28) return name;
  return `${name.slice(0, 27)}…`;
}
