import type { Metadata } from "next";
import Image from "next/image";
import Breadcrumb from "@/components/Breadcrumb";
import { companyInfo } from "@/lib/data/company";

export const metadata: Metadata = {
  title: "運営会社",
  description: "roomy の運営会社情報です。",
};

export default function CompanyPage() {
  return (
    <div className="pb-16 md:pb-20">
      <div className="relative aspect-21/9 min-h-56 w-full md:min-h-72">
        <Image
          src="/images/common/about_v1.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-3xl px-4 pb-8 md:px-6 md:pb-10">
            <p className="text-xs tracking-[0.2em] text-white/80">COMPANY</p>
            <h1 className="mt-2 font-serif text-3xl text-white md:text-4xl">運営会社</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pt-8 md:px-6">
        <Breadcrumb items={[{ label: "TOP", href: "/" }, { label: "運営会社" }]} />

        <p className="mt-10 text-sm leading-relaxed text-[#6b6b6b] md:text-base">
          {companyInfo.shopName} は、「暮らしに、心地いい居場所を。」をコンセプトに、
          家具から雑貨までをセレクトしてお届けするインテリアショップです。
        </p>

        <dl className="mt-10 divide-y divide-[#e8e2d9] border-y border-[#e8e2d9] text-sm">
          {[
            ["会社名", companyInfo.name],
            ["代表者", companyInfo.representative],
            ["所在地", companyInfo.address],
            ["電話番号", companyInfo.phone],
            ["資本金", companyInfo.capital],
            ["事業内容", companyInfo.business],
            ["メール", companyInfo.email],
            ["営業時間", companyInfo.hours],
          ].map(([label, value]) => (
            <div key={label} className="grid gap-2 py-4 sm:grid-cols-[140px_1fr]">
              <dt className="text-[#6b6b6b]">{label}</dt>
              <dd className="text-text">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
