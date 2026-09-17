import { getSiteSettings } from "../lib/site-settings";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const settings = await getSiteSettings();
  return <LoginClient companyNameEn={settings.company_name_en} />;
}
