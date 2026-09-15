import { redirect } from "next/navigation";
import { getCurrentSession } from "../../lib/auth";
import ProfileEditPage from "./ProfileEditPage";

export default async function ProfilePage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/mypage/profile");
  return <main>
    <section className="companyHero mypageHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>회원정보 수정</h1><span>HOME &gt; 마이페이지 &gt; 회원정보 수정</span></div></section>
    <section className="profilePageSection contentWidth">
      <div className="profilePageHead"><div><span>MY PROFILE</span><h1>회원정보 수정</h1><p>거래처 기본정보를 수정할 수 있습니다.</p></div></div>
      <ProfileEditPage profile={session.profile}/>
    </section>
  </main>;
}
