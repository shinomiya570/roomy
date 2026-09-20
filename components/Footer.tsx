import Link from "next/link";

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

const supportLinks = [
  { href: "/guide", label: "ご利用ガイド" },
  { href: "/guide/faq", label: "よくあるご質問" },
  { href: "/contact", label: "お問い合わせ" },
  { href: "/login", label: "ログイン" },
  { href: "/register", label: "新規会員登録" },
  { href: "/mypage", label: "マイページ" },
];

const legalLinks = [
  { href: "/company", label: "運営会社" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/terms", label: "ご利用規約" },
  { href: "/legal", label: "特定商取引法に基づく表示" },
];

// const snsLinks = [
//   { href: "https://www.instagram.com/", label: "Instagram" },
//   { href: "https://x.com/", label: "X" },
//   { href: "https://line.me/", label: "LINE" },
// ];

const paymentMethods = ["クレジットカード", "Apple Pay", "代金引換"];

export default function Footer() {
  return (
    <footer className="mt-auto bg-footer text-footer-text">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* ブランド */}
          <div className="space-y-4">
            <Link href="/">
              <img
                src="/images/logo_v1.png?v=2"
                alt="roomy"
                width={480}
                height={120}
                className="h-9 w-auto mix-blend-darken"
              />
            </Link>
            <p className="font-serif text-sm leading-relaxed text-text">
              暮らしに、心地いい居場所を。
            </p>
            {/* <ul className="flex flex-wrap gap-3 pt-2">
              {snsLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline-offset-2 hover:text-accent-1 hover:underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul> */}
          </div>

          {/* カテゴリ */}
          <div>
            <h2 className="mb-4 font-serif text-sm font-medium text-text">
              カテゴリから探す
            </h2>
            <ul className="space-y-2">
              {categories.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm underline-offset-2 hover:text-accent-1 hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 利用シーン */}
          <div>
            <h2 className="mb-4 font-serif text-sm font-medium text-text">
              利用シーンから探す
            </h2>
            <ul className="mb-8 space-y-2">
              {scenes.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm underline-offset-2 hover:text-accent-1 hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="mb-4 font-serif text-sm font-medium text-text">
              会員・サポート
            </h2>
            <ul className="space-y-2">
              {supportLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm underline-offset-2 hover:text-accent-1 hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 法務・支払い */}
          <div>
            <h2 className="mb-4 font-serif text-sm font-medium text-text">
              会社情報・規約
            </h2>
            <ul className="mb-8 space-y-2">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm underline-offset-2 hover:text-accent-1 hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="mb-4 font-serif text-sm font-medium text-text">
              お支払い方法
            </h2>
            <ul className="flex flex-wrap gap-2">
              {paymentMethods.map((method) => (
                <li
                  key={method}
                  className="rounded-sm border border-[#d9d2c8] px-2.5 py-1 text-xs"
                >
                  {method}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-[#d9d2c8] pt-6 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} roomy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
