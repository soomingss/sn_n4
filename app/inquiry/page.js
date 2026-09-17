import { getSiteSettings } from "../lib/site-settings";
import InquiryClient from "./InquiryClient";

export default async function InquiryPage() {
  const settings = await getSiteSettings();

  return (
    <InquiryClient
      companyName={settings.company_name}
      companyNameEn={settings.company_name_en}
    />
  );
}
