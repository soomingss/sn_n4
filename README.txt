신농허브 홈페이지 v14 - 로그인/관리자 권한 1차 구현

기존 v13 디자인과 기능을 유지하면서 아래 기능을 추가했습니다.

[로그인/권한]
- /login 아이디 + 비밀번호 로그인
- profiles.username을 기준으로 계정 조회 후 Supabase Auth 비밀번호 검증
- 로그인 상태 유지 체크 지원
- 로그인 세션은 HttpOnly 서명 쿠키로 저장(서비스 키는 브라우저에 노출되지 않음)
- 로그아웃 기능
- role=admin 계정에서만 데스크톱/모바일 상단 메뉴에 '관리자업무' 노출
- /admin 및 하위 관리자 페이지도 서버에서 관리자 권한 재검증

[관리자]
- /admin : 거래처 승인관리 / 주문관리 / 문의사항관리 3개 카드
- 빠른 현황 영역 없음
- /admin/partners : 거래처 승인 대기/완료/거절 목록 및 승인/거절 실제 처리
- 모바일에서는 거래처 목록을 카드형으로 표시
- /admin/orders, /admin/inquiries : 관리자 전용 진입 페이지 구성 (세부 데이터 관리 기능은 다음 단계)

[제품안내]
- /products 접근 제한
- 비로그인: /login?next=/products 로 이동
- customer + pending/rejected: '거래처 승인 후 이용 가능합니다.' 안내
- approved 또는 admin: 제품안내 전용 영역 접근
- 실제 제품 목록/검색 UI는 아직 구성하지 않음

[v13 이후 승인된 수정 반영]
- 메인 B2B 문의하기 -> /inquiry 연결
- 오시는 길 소개 문장의 강제 줄바꿈 제거
- 주차 안내 문장의 강제 줄바꿈 제거
- 카카오맵 폭을 연락처 박스와 동일한 폭으로 변경

[Vercel 환경변수 - 기존 값 유지]
1) SUPABASE_URL
2) SUPABASE_SERVICE_ROLE_KEY
3) NEXT_PUBLIC_KAKAO_MAP_APP_KEY

[profiles 필수 구조]
- id uuid (auth.users.id FK)
- created_at timestamptz
- username text unique not null
- company_name text not null
- contact_name text not null
- phone text not null
- email text not null
- status text not null (pending / approved / rejected)
- role text not null (customer / admin)

주의:
- SUPABASE_SERVICE_ROLE_KEY는 절대 NEXT_PUBLIC_ 환경변수로 만들지 마세요.
- 로그인 테스트 계정의 profiles.id는 반드시 Authentication 사용자 UID와 같아야 합니다.
- Supabase 권한 오류가 발생하는 경우 SQL Editor에서 다음 권한을 확인하세요:
  GRANT SELECT, UPDATE ON public.profiles TO service_role;
- 기존 GitHub 저장소에 압축을 풀어 파일을 덮어쓴 뒤 Commit하면 Vercel이 자동 배포합니다.
