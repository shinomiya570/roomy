"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import HeaderCartLink from "@/components/HeaderCartLink";

const categories = [
  { href: "/category/sofa", label: "ソファ" },
  { href: "/category/table", label: "テーブル・デスク" },
  { href: "/category/chair", label: "チェア・ベンチ" },
  { href: "/category/tvboard", label: "テレビボード" },
  { href: "/category/storage", label: "リビング収納" },
  { href: "/category/bed", label: "ベッド" },
  { href: "/category/kitchen", label: "キッチン収納" },
  { href: "/category/clothing", label: "衣類収納" },
  { href: "/category/kotatsu", label: "こたつ" },
  { href: "/category/lighting", label: "照明" },
  { href: "/category/rug", label: "ラグ・ファブリック" },
  { href: "/category/mirror", label: "ミラー" },
  { href: "/category/storagegoods", label: "収納雑貨" },
  { href: "/category/objects", label: "置物・オブジェ" },
  { href: "/category/goods", label: "インテリア雑貨" },
];

const scenes = [
  { href: "/scene/living", label: "リビング" },
  { href: "/scene/dining", label: "ダイニング・キッチン" },
  { href: "/scene/bedroom", label: "寝室" },
  { href: "/scene/study", label: "書斎・オフィス" },
];

const navLinks = [
  { href: "/ranking", label: "ランキング" },
  { href: "/newarrival", label: "新着" },
  { href: "/feature", label: "特集" },
  { href: "/guide", label: "サポート" },
  { href: "/company", label: "運営会社" },
];

function SearchIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-6 w-6"
      aria-hidden
    >
      <path
        d="M12 21s-6.5-4.35-9.33-8.18C.78 10.3 1.4 6.9 4.2 5.3c1.8-1.03 4.05-.55 5.4 1.1L12 9l2.4-2.6c1.35-1.65 3.6-2.13 5.4-1.1 2.8 1.6 3.42 5 1.53 7.52C18.5 16.65 12 21 12 21z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-6 w-6"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path
        d="M5 19.5c1.5-3.2 4-4.8 7-4.8s5.5 1.6 7 4.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-6 w-6"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3.5 7l8.5 6 8.5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-6 w-6"
      aria-hidden
    >
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
      ) : (
        <>
          <path d="M4 7h16" strokeLinecap="round" />
          <path d="M4 12h16" strokeLinecap="round" />
          <path d="M4 17h16" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<"category" | "scene" | null>(null);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
    setOpenGroup(null);
  };

  return (
    <header className="sticky top-0 z-50 bg-white">
      {/* 上段：ロゴ / 検索 / アイコン */}
      <div className="border-b border-[#e5e5e5]">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:gap-4 sm:px-4 sm:py-5 md:gap-8 md:px-6 md:py-6">
          <button
            type="button"
            className="rounded-sm p-2 text-text hover:bg-[#f5f5f5] md:hidden"
            aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <MenuIcon open={menuOpen} />
          </button>

          <Link href="/" className="flex min-w-0 shrink items-center gap-2 sm:gap-3" onClick={closeMenu}>
            <Image
              src="/images/icon_v1.png"
              alt=""
              width={40}
              height={40}
              className="h-8 w-8 shrink-0 sm:h-9 sm:w-9 md:h-10 md:w-10"
              priority
            />
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-serif text-lg tracking-wide text-text sm:text-xl md:text-2xl">
                roomy
              </span>
              <span className="mt-0.5 hidden text-[10px] tracking-wider text-[#8a8a8a] sm:block md:text-xs">
                公式オンラインストア
              </span>
            </span>
          </Link>

          <form
            action="/search"
            method="get"
            className="mx-auto hidden min-w-0 max-w-xl flex-1 md:block md:max-w-2xl"
            role="search"
          >
            <div className="flex h-11 items-center rounded-full border border-[#d9d9d9] bg-[#f7f7f7] px-4 transition focus-within:border-accent-1 focus-within:bg-white md:h-12">
              <input
                type="search"
                name="q"
                placeholder="キーワードから商品を検索"
                className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-[#9a9a9a]"
              />
              <button
                type="submit"
                className="ml-2 shrink-0 text-[#666] transition hover:text-accent-1"
                aria-label="検索"
              >
                <SearchIcon />
              </button>
            </div>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1 md:gap-3">
            <Link
              href="/search"
              className="rounded-sm p-2 text-text hover:bg-[#f5f5f5] md:hidden"
              aria-label="検索"
              onClick={closeMenu}
            >
              <SearchIcon className="h-6 w-6" />
            </Link>
            <Link
              href="/contact"
              className="hidden rounded-sm p-2 text-text hover:bg-[#f5f5f5] sm:inline-flex"
              aria-label="お問い合わせ"
            >
              <MailIcon />
            </Link>
            <Link
              href="/login"
              className="rounded-sm p-2 text-text hover:bg-[#f5f5f5]"
              aria-label="会員・ログイン"
              onClick={closeMenu}
            >
              <UserIcon />
            </Link>
            <Link
              href="/mypage/favorite"
              className="hidden rounded-sm p-2 text-text hover:bg-[#f5f5f5] sm:inline-flex"
              aria-label="お気に入り"
            >
              <HeartIcon />
            </Link>
            <HeaderCartLink />
          </div>
        </div>
      </div>

      {/* 下段：タブレット・PC向けセクションメニュー */}
      <div className="hidden border-b border-[#e5e5e5] bg-white md:block">
        <nav
          className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-0.5 gap-y-1 px-3 py-3 md:gap-x-1 md:px-4 md:py-4 lg:gap-x-2 lg:px-6 lg:py-5"
          aria-label="メインナビゲーション"
        >
          <div className="group relative shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-2 text-sm text-text transition hover:text-accent-1 lg:gap-1.5 lg:px-4 lg:py-2.5 lg:text-lg"
            >
              カテゴリ
              <ChevronDown />
            </button>
            <div className="invisible absolute top-full left-0 z-50 min-w-52 rounded-sm border border-[#e5e5e5] bg-white py-2 text-left opacity-0 shadow-md transition group-hover:visible group-hover:opacity-100">
              {categories.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2.5 text-sm text-text hover:bg-[#f7f7f7] hover:text-accent-1 lg:text-base"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="group relative shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-2 text-sm text-text transition hover:text-accent-1 lg:gap-1.5 lg:px-4 lg:py-2.5 lg:text-lg"
            >
              利用シーン
              <ChevronDown />
            </button>
            <div className="invisible absolute top-full left-0 z-50 min-w-52 rounded-sm border border-[#e5e5e5] bg-white py-2 text-left opacity-0 shadow-md transition group-hover:visible group-hover:opacity-100">
              {scenes.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2.5 text-sm text-text hover:bg-[#f7f7f7] hover:text-accent-1 lg:text-base"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 px-2.5 py-2 text-sm text-text transition hover:text-accent-1 lg:px-4 lg:py-2.5 lg:text-lg"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* お知らせバー */}
      <div className="flex min-h-9 items-center justify-center bg-[#3a3a3a] px-3 py-2 text-center text-[11px] leading-snug text-white sm:px-4 sm:text-xs">
        <Link href="/news" className="hover:underline" onClick={closeMenu}>
          <span className="sm:hidden">22,000円以上で送料無料｜オープン記念実施中</span>
          <span className="hidden sm:inline">
            22,000円（税込）以上のご購入で送料無料｜オープン記念キャンペーン実施中
          </span>
        </Link>
      </div>

      {/* スマホ・小型タブレット：ドロワーメニュー */}
      {menuOpen ? (
        <div className="fixed inset-0 top-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="メニューを閉じる"
            onClick={closeMenu}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] px-4 py-4">
              <p className="font-serif text-lg text-text">メニュー</p>
              <button
                type="button"
                className="rounded-sm p-2 hover:bg-[#f5f5f5]"
                aria-label="閉じる"
                onClick={closeMenu}
              >
                <MenuIcon open />
              </button>
            </div>

            <form action="/search" method="get" className="border-b border-[#e5e5e5] p-4" role="search">
              <div className="flex h-11 items-center rounded-full border border-[#d9d9d9] bg-[#f7f7f7] px-4">
                <input
                  type="search"
                  name="q"
                  placeholder="キーワード検索"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
                <button type="submit" aria-label="検索" onClick={closeMenu}>
                  <SearchIcon />
                </button>
              </div>
            </form>

            <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="モバイルナビゲーション">
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-3 text-left text-base text-text"
                onClick={() =>
                  setOpenGroup((prev) => (prev === "category" ? null : "category"))
                }
              >
                カテゴリ
                <ChevronDown />
              </button>
              {openGroup === "category" ? (
                <ul className="mb-2 bg-[#faf8f5] py-1">
                  {categories.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block px-5 py-2.5 text-sm text-text"
                        onClick={closeMenu}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}

              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-3 text-left text-base text-text"
                onClick={() =>
                  setOpenGroup((prev) => (prev === "scene" ? null : "scene"))
                }
              >
                利用シーン
                <ChevronDown />
              </button>
              {openGroup === "scene" ? (
                <ul className="mb-2 bg-[#faf8f5] py-1">
                  {scenes.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block px-5 py-2.5 text-sm text-text"
                        onClick={closeMenu}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}

              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-3 text-base text-text"
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-4 border-t border-[#e5e5e5] pt-2">
                <Link
                  href="/contact"
                  className="block px-3 py-3 text-base text-text"
                  onClick={closeMenu}
                >
                  お問い合わせ
                </Link>
                <Link
                  href="/mypage/favorite"
                  className="block px-3 py-3 text-base text-text"
                  onClick={closeMenu}
                >
                  お気に入り
                </Link>
                <Link
                  href="/login"
                  className="block px-3 py-3 text-base text-text"
                  onClick={closeMenu}
                >
                  ログイン
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-3 text-base text-accent-1"
                  onClick={closeMenu}
                >
                  新規会員登録
                </Link>
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
