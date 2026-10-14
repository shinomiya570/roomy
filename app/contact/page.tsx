import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import ContactForm from "@/components/ContactForm";
import { companyInfo } from "@/lib/data/company";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: "roomy へのお問い合わせフォームです。",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-16">
      <Breadcrumb items={[{ label: "TOP", href: "/" }, { label: "お問い合わせ" }]} />

      <div className="mt-8 mb-10">
        <p className="text-xs tracking-[0.2em] text-accent-2">CONTACT</p>
        <h1 className="mt-2 font-serif text-3xl text-text">お問い合わせ</h1>
        <p className="mt-3 text-sm text-[#6b6b6b]">
          商品や配送に関するご質問は、下記フォームよりお気軽にご連絡ください。
        </p>
      </div>

      <dl className="mb-10 grid gap-3 rounded-sm bg-[#f1ede7] p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[#6b6b6b]">メール</dt>
          <dd className="mt-1 text-text">{companyInfo.email}</dd>
        </div>
        <div>
          <dt className="text-[#6b6b6b]">電話番号</dt>
          <dd className="mt-1 text-text">{companyInfo.phone}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[#6b6b6b]">営業時間</dt>
          <dd className="mt-1 text-text">{companyInfo.hours}</dd>
        </div>
      </dl>

      <ContactForm />
    </div>
  );
}
