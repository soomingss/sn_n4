import { getSiteSettings } from "../lib/site-settings";
import SignupClient from "./SignupClient";

export default async function SignupPage() {
  const settings = await getSiteSettings();
  return <SignupClient companyNameEn={settings.company_name_en} />;
}
