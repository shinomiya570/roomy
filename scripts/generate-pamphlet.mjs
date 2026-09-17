#!/usr/bin/env node
// @ts-check
/**
 * roomy 3つ折りパンフレット PDF 生成
 *
 * lib/data/products.ts の商品画像・価格から HTML を組み立て、
 * Puppeteer で印刷用 PDF (A4横・2ページ) を出力します。
 *
 * 実行: npm run pamphlet
 * 出力: output/pamphlet-roomy.html, output/pamphlet-roomy.pdf
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import {
  loadProducts,
  pickFeaturedProducts,
  pickHeroProduct,
  pickByCategory,
  pickProductById,
} from "./pamphlet/data.mjs";
import { renderPamphletHtml } from "./pamphlet/render.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUTPUT_DIR = join(ROOT, "output");
const HTML_PATH = join(OUTPUT_DIR, "pamphlet-roomy.html");
const PDF_PATH = join(OUTPUT_DIR, "pamphlet-roomy.pdf");

/** 表（外側）左パネル: リビングまわりの注目5品 */
const OUTSIDE_CATEGORIES = ["sofa", "rug", "lighting", "tvboard", "storage"];
/** 裏（内側）右パネル: 暮らしのおすすめ5品 */
const INSIDE_CATEGORIES = ["chair", "bed", "kotatsu", "table", "goods"];

/** 裏（内側）左パネル: ヒーロービジュアル */
const HERO_SCENE_PRODUCT_ID = "spi-lt-4452";

const execFileAsync = promisify(execFile);
const WINDOWS_CHROME = "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe";

/**
 * @param {string} htmlPath
 * @param {string} pdfPath
 */
async function createPdf(htmlPath, pdfPath) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--font-render-hinting=medium", "--disable-dev-shm-usage"],
    });
    try {
      const page = await browser.newPage();
      await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, {
        waitUntil: "networkidle0",
      });
      await page.evaluateHandle("document.fonts.ready");
      await page.pdf({
        path: pdfPath,
        format: "A4",
        landscape: true,
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
      return;
    } finally {
      await browser.close();
    }
  } catch (err) {
    if (!existsSync(WINDOWS_CHROME)) throw err;
    const firstLine = String(err?.message || err).split("\n")[0];
    console.warn(`Linux Chrome を起動できないため、Windows の Chrome で PDF 化します。（${firstLine}）`);
  }

  const { stdout: htmlWin } = await execFileAsync("wslpath", ["-w", htmlPath]);
  const { stdout: pdfWin } = await execFileAsync("wslpath", ["-w", pdfPath]);
  await execFileAsync(WINDOWS_CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${pdfWin.trim()}`,
    htmlWin.trim(),
  ]);
}

async function main() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.PAMPHLET_SITE_URL?.replace(/\/$/, "") ||
    "https://roomy-right.com";

  console.log("商品データを読み込み中...");
  const products = loadProducts(ROOT);
  console.log(`  ${products.length} 商品`);

  const outsideProducts = pickFeaturedProducts(products, OUTSIDE_CATEGORIES);
  const insideProducts = pickFeaturedProducts(products, INSIDE_CATEGORIES);
  const heroProduct = pickHeroProduct(products);
  const heroSceneProduct = pickProductById(products, HERO_SCENE_PRODUCT_ID);
  const storyProduct = pickByCategory(products, "table", 0);
  if (!storyProduct) {
    throw new Error("テーブル・デスクカテゴリの商品が見つかりません");
  }

  console.log("表パネル商品:", outsideProducts.map((p) => p.id).join(", "));
  console.log("裏パネル商品:", insideProducts.map((p) => p.id).join(", "));
  console.log("ヒーロー商品:", heroProduct.id);
  console.log("ヒーロー画像:", heroSceneProduct.id);
  console.log("ストーリー画像:", storyProduct.id);

  const html = await renderPamphletHtml({
    root: ROOT,
    products,
    outsideProducts,
    insideProducts,
    heroProduct,
    storyProduct,
    siteUrl,
    heroSceneImage: heroSceneProduct.image,
    logoImage: "/images/logo_v1.png",
  });

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(HTML_PATH, html, "utf8");
  console.log(`HTML: ${HTML_PATH}`);

  console.log("PDF を生成中...");
  await createPdf(HTML_PATH, PDF_PATH);

  console.log(`PDF:  ${PDF_PATH}`);
  console.log("完了。印刷時は両面印刷・短辺とじを推奨します。");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
