import { getSiteSettings } from "../lib/site-settings";
import InquiryClient from "./InquiryClient";

export default async function InquiryPage({ searchParams }) {
  const { type } = await searchParams;
  const settings = await getSiteSettings();

  return (
    <InquiryClient key={type === "food" ? "food" : "general"} foodQuote={type === "food"}
      companyName={settings.company_name}
      companyNameEn={settings.company_name_en}
    />
  );
}
