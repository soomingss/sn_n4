신농허브 홈페이지 v11

- 기존 v10 디자인/구조 유지
- 데스크톱/모바일 거래처 신청 기능 통일
  · 홈페이지 문의하기 -> /inquiry
  · 카카오톡 문의하기 -> http://pf.kakao.com/_axdbrX
- 홈페이지 문의 페이지 상단을 회사소개와 동일한 company-hero.jpg 배너로 변경
- 문의 유형: 제품 문의 / 가격 문의 / 납품 문의 / 기타 문의
- 문의 제출 시 Next.js 서버 API를 통해 Supabase inquiries 테이블에 저장

Vercel 환경변수
1) SUPABASE_URL
2) SUPABASE_SERVICE_ROLE_KEY
3) NEXT_PUBLIC_KAKAO_MAP_APP_KEY (기존 값 유지)

주의:
- SUPABASE_SERVICE_ROLE_KEY는 브라우저에 노출되면 안 됩니다.
- NEXT_PUBLIC_ 접두사를 붙이지 마세요.
- 기존 Vercel 프로젝트와 GitHub 저장소를 그대로 사용하고 파일만 덮어쓰면 됩니다.
