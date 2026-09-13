신농허브 홈페이지 v10

- 기존 v9 디자인/구조 유지
- 모바일 햄버거 메뉴의 회사소개 하위메뉴 유지
- 모바일 메뉴에 거래처 문의 하위메뉴 추가
  · 홈페이지 문의하기 -> /inquiry
  · 카카오톡 문의하기 -> http://pf.kakao.com/_axdbrX
- 홈페이지 문의 페이지 추가
- 문의 제출 시 Next.js 서버 API를 통해 Supabase inquiries 테이블에 저장

Vercel 환경변수 (서버 전용)
1) SUPABASE_URL
2) SUPABASE_SERVICE_ROLE_KEY

주의:
- SUPABASE_SERVICE_ROLE_KEY는 브라우저에 노출되면 안 됩니다.
- NEXT_PUBLIC_ 접두사를 붙이지 마세요.
- 카카오맵의 기존 NEXT_PUBLIC_KAKAO_MAP_APP_KEY 설정은 그대로 유지합니다.
