#!/usr/bin/env python3
"""
Re:CENO から商品画像を収集し manifest を出力する。

【出力】
  data/receno/manifests/mirror.json
  public/images/products/{product_id}/01.jpg ...

【実行例】
  python scripts/receno_fetch.py
  python scripts/receno_fetch.py --config data/receno/config.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from html import unescape
from pathlib import Path
from threading import Lock
from urllib.parse import urljoin, urlparse

import requests

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DEFAULT_CONFIG_PATH = PROJECT_ROOT / "data" / "receno" / "config.json"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

JST = timezone(timedelta(hours=9))
print_lock = Lock()

PRODUCT_HREF_RE = re.compile(
    r'href="((?:https://www\.receno\.com)?/(?!pen/|feature/|guide/|about/|shop/)[^"]+\.php)"',
    re.I,
)
DETAIL_IMAGE_RE = re.compile(
    r'(?:https://www\.receno\.com)?((?:/[A-Za-z0-9_-]+)+/img/\d+-b\.jpe?g)',
    re.I,
)
PRICE_RE = re.compile(
    r'class="cart-saleprice">\s*[￥¥]\s*([0-9,]+)',
    re.I,
)


@dataclass
class Config:
    base_url: str = "https://www.receno.com"
    category_urls: list[str] = field(default_factory=list)
    max_products: int = 10
    max_images_per_product: int = 8
    request_interval_sec: float = 1.0
    concurrency: int = 2
    default_category_slug: str = "mirror"
    product_urls: list[str] = field(default_factory=list)
    manifest_path: Path = field(
        default_factory=lambda: PROJECT_ROOT / "data" / "receno" / "manifests" / "mirror.json"
    )
    images_dir: Path = field(
        default_factory=lambda: PROJECT_ROOT / "public" / "images" / "products"
    )
    images_web_path: str = "/images/products"


def log(msg: str) -> None:
    with print_lock:
        print(msg, flush=True)


def resolve_project_path(raw_path: str | Path) -> Path:
    path = Path(raw_path)
    if path.is_absolute():
        return path
    return PROJECT_ROOT / path


def load_config(path: Path) -> Config:
    raw = {}
    if path.is_file():
        raw = json.loads(path.read_text(encoding="utf-8"))

    category_urls = raw.get("categoryUrls") or []
    if not category_urls and raw.get("categoryUrl"):
        category_urls = [raw["categoryUrl"]]

    manifest_path = resolve_project_path(
        raw.get("manifestPath", "data/receno/manifests/mirror.json")
    )

    return Config(
        base_url=raw.get("baseUrl", "https://www.receno.com").rstrip("/"),
        category_urls=category_urls,
        max_products=int(raw.get("maxProducts", 10)),
        max_images_per_product=int(raw.get("maxImagesPerProduct", 8)),
        request_interval_sec=float(raw.get("requestIntervalSec", 1.0)),
        concurrency=max(1, int(raw.get("concurrency", 2))),
        default_category_slug=raw.get("defaultCategorySlug", "mirror"),
        product_urls=list(raw.get("productUrls") or []),
        manifest_path=manifest_path,
        images_dir=resolve_project_path(raw.get("imagesDir", "public/images/products")),
        images_web_path=raw.get("imagesWebPath", "/images/products").rstrip("/"),
    )


def sanitize_dirname(name: str) -> str:
    name = re.sub(r'[\\/:*?"<>|]', "_", name)
    return name.strip() or "unknown"


def fetch_html(url: str) -> str:
    res = requests.get(
        url,
        headers={"User-Agent": USER_AGENT, "Referer": "https://www.receno.com/mirror/"},
        timeout=30,
    )
    res.raise_for_status()
    res.encoding = res.apparent_encoding or "utf-8"
    return unescape(res.text)


def slug_from_url(url: str) -> str:
    path = urlparse(url).path
    name = Path(path).stem
    return sanitize_dirname(name)


def normalize_product_url(base: str, href: str) -> str:
    url = urljoin(base + "/", href)
    return url.split("?")[0].split("#")[0]


def extract_product_urls(html: str, base_url: str) -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()
    for href in PRODUCT_HREF_RE.findall(html):
        url = normalize_product_url(base_url, href)
        if url.rstrip("/").endswith("/mirror/") or url in seen:
            continue
        seen.add(url)
        urls.append(url)
    return urls


def stubs_from_product_urls(cfg: Config) -> list[dict]:
    products: list[dict] = []
    seen: set[str] = set()
    for index, raw_url in enumerate(cfg.product_urls, start=1):
        url = normalize_product_url(cfg.base_url, raw_url)
        if url in seen:
            continue
        seen.add(url)
        products.append({
            "id": slug_from_url(url),
            "itemUrl": url,
            "rank": len(products) + 1,
        })
        if len(products) >= cfg.max_products:
            break
    return products


def collect_product_urls(cfg: Config) -> list[dict]:
    products: list[dict] = []
    seen: set[str] = set()
    for category_url in cfg.category_urls:
        try:
            html = fetch_html(category_url)
        except requests.RequestException as exc:
            log(f"  カテゴリ取得失敗 ({category_url}): {exc}")
            continue
        for url in extract_product_urls(html, cfg.base_url):
            if url in seen:
                continue
            seen.add(url)
            products.append({
                "id": slug_from_url(url),
                "itemUrl": url,
                "rank": len(products) + 1,
            })
            if len(products) >= cfg.max_products:
                break
        log(f"  カテゴリ {category_url} → 累計 {len(products)}件")
        if len(products) >= cfg.max_products:
            break
        time.sleep(cfg.request_interval_sec)
    return products[: cfg.max_products]


def parse_title(html: str) -> str:
    match = re.search(r"<title>([^<]+)</title>", html, re.I)
    if not match:
        return ""
    title = match.group(1).strip()
    title = re.sub(r"\s*[|｜].*$", "", title).strip()
    return title


def parse_price(html: str) -> int:
    match = PRICE_RE.search(html)
    if match:
        return int(match.group(1).replace(",", ""))
    return 0


def extract_ordered_image_urls(html: str, item_url: str, max_images: int) -> list[str]:
    slug = slug_from_url(item_url)
    found = DETAIL_IMAGE_RE.findall(html)
    numbered: list[tuple[int, str]] = []
    seen: set[str] = set()
    for raw in found:
        if f"/{slug}/img/" not in raw:
            continue
        num_match = re.search(r"/(\d+)-b\.jpe?g$", raw, re.I)
        if not num_match:
            continue
        abs_url = urljoin("https://www.receno.com", raw)
        if abs_url in seen:
            continue
        seen.add(abs_url)
        numbered.append((int(num_match.group(1)), abs_url))
    numbered.sort(key=lambda item: item[0])
    urls = [url for _, url in numbered[:max_images]]
    if len(urls) < max_images:
        main_url = urljoin(item_url.replace(".php", "/"), "img/main-img.jpg")
        if main_url not in seen:
            urls.append(main_url)
    return urls[:max_images]


def download_image(url: str, save_path: Path, referer: str) -> Path:
    if save_path.exists() and save_path.stat().st_size > 0:
        return save_path

    res = requests.get(
        url,
        headers={"User-Agent": USER_AGENT, "Referer": referer},
        timeout=30,
    )
    res.raise_for_status()
    save_path.parent.mkdir(parents=True, exist_ok=True)
    save_path.write_bytes(res.content)
    return save_path


def enrich_product(cfg: Config, product: dict) -> dict:
    html = fetch_html(product["itemUrl"])
    product["name"] = parse_title(html)
    product["price"] = parse_price(html)
    product["imageUrls"] = extract_ordered_image_urls(
        html, product["itemUrl"], cfg.max_images_per_product
    )
    product["itemCode"] = f"receno:{product['id']}"
    return product


def process_product(cfg: Config, product: dict) -> dict:
    product_id = sanitize_dirname(product["id"])
    name = (product.get("name") or product_id).strip()
    source_urls = product.get("imageUrls") or []

    if not source_urls:
        raise ValueError("画像 URL が見つかりません")

    image_dir = cfg.images_dir / product_id
    saved_paths: list[str] = []
    saved_sources: list[str] = []

    for index, url in enumerate(source_urls, start=1):
        target = image_dir / f"{index:02d}.jpg"
        try:
            saved = download_image(url, target, product["itemUrl"])
            web_path = f"{cfg.images_web_path}/{product_id}/{saved.name}"
            saved_paths.append(web_path)
            saved_sources.append(url)
            log(f"    [{product_id}] 保存: {saved.name} ← {url.rsplit('/', 1)[-1]}")
        except requests.RequestException as exc:
            log(f"    [{product_id}] 画像{index}失敗: {exc}")

    if not saved_paths:
        raise ValueError("画像の保存にすべて失敗しました")

    return {
        "id": product_id,
        "name": name,
        "price": int(product.get("price") or 0),
        "categorySlug": cfg.default_category_slug,
        "itemUrl": product.get("itemUrl", ""),
        "itemCode": product.get("itemCode", product_id),
        "rank": product.get("rank"),
        "images": saved_paths,
        "sourceUrls": saved_sources,
    }


def write_manifest(cfg: Config, products: list[dict]) -> Path:
    manifest = {
        "generatedAt": datetime.now(JST).isoformat(),
        "source": {
            "site": "receno.com",
            "baseUrl": cfg.base_url,
            "categoryUrls": cfg.category_urls,
        },
        "products": products,
    }
    cfg.manifest_path.parent.mkdir(parents=True, exist_ok=True)
    cfg.manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return cfg.manifest_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Re:CENO 商品画像収集 + manifest 生成")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG_PATH, help="設定 JSON")
    parser.add_argument("--max-products", type=int, help="取得商品数上書き")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    config_path = args.config
    if not config_path.is_absolute():
        config_path = PROJECT_ROOT / config_path

    cfg = load_config(config_path)
    if args.max_products:
        cfg.max_products = args.max_products

    if not cfg.product_urls and not cfg.category_urls:
        print("エラー: categoryUrls または productUrls が設定されていません")
        sys.exit(1)

    cfg.images_dir.mkdir(parents=True, exist_ok=True)

    log("=== Re:CENO 画像収集 (nookinterior) ===")
    log(f"baseUrl        : {cfg.base_url}")
    log(f"maxProducts    : {cfg.max_products}")
    log(f"maxImages/prod : {cfg.max_images_per_product}")
    log(f"concurrency    : {cfg.concurrency}")
    log(f"manifest       : {cfg.manifest_path}")
    log(f"imagesDir      : {cfg.images_dir}")

    if cfg.product_urls:
        product_stubs = stubs_from_product_urls(cfg)
        log(f"productUrls    : {len(product_stubs)} 件（指定URLから取得）")
    else:
        product_stubs = collect_product_urls(cfg)
    if not product_stubs:
        log("商品が見つかりませんでした。")
        sys.exit(1)

    log(f"\n商品メタデータ取得 ({len(product_stubs)} 件)...")
    products: list[dict] = []
    for index, stub in enumerate(product_stubs, start=1):
        if index > 1:
            time.sleep(cfg.request_interval_sec)
        try:
            products.append(enrich_product(cfg, stub))
            log(
                f"  [{stub['id']}] {stub.get('name', '')[:50]} "
                f"({len(stub.get('imageUrls', []))}枚)"
            )
        except Exception as exc:  # noqa: BLE001
            log(f"  [{stub['id']}] メタデータ取得失敗: {exc}")

    if not products:
        log("処理可能な商品がありませんでした。")
        sys.exit(1)

    log(f"\n画像ダウンロード開始 ({len(products)} 件)...")
    manifest_products: list[dict] = []
    failures: list[str] = []

    with ThreadPoolExecutor(max_workers=cfg.concurrency) as executor:
        futures = {
            executor.submit(process_product, cfg, product): product for product in products
        }
        for future in as_completed(futures):
            product = futures[future]
            try:
                result = future.result()
                manifest_products.append(result)
                log(
                    f"[完了] {result['id']} "
                    f"({len(result['images'])}枚) {result['name'][:50]}"
                )
            except Exception as exc:  # noqa: BLE001
                failures.append(product.get("id", "unknown"))
                log(f"[失敗] {product.get('id')}: {exc}")

    manifest_products.sort(
        key=lambda p: (p.get("rank") is None, p.get("rank") or 9999, p["id"])
    )
    manifest_path = write_manifest(cfg, manifest_products)

    total_images = sum(len(p["images"]) for p in manifest_products)
    avg_images = total_images / len(manifest_products) if manifest_products else 0

    log("\n=== Re:CENO 取得完了 ===")
    log(f"商品数     : {len(manifest_products)} / {cfg.max_products}")
    log(f"画像合計   : {total_images} 枚")
    log(f"平均枚数   : {avg_images:.1f} 枚/商品")
    log(f"失敗       : {len(failures)} 件")
    if failures:
        log(f"失敗ID     : {', '.join(failures[:10])}")
    log(f"manifest   : {manifest_path}")
    log(f"images     : {cfg.images_dir}")


if __name__ == "__main__":
    main()
