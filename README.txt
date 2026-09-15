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

[v20 업데이트 - v20 기준 추가 반영]
- v20의 기존 디자인/페이지 구성 유지
- 제품안내 주문하기를 Supabase orders / order_items 저장 흐름에 연결
  · 로그인 + 승인 거래처만 주문 가능
  · profiles.price_grade 기준 product_prices 가격을 서버에서 재검증
  · 주문금액은 서버에서 계산 후 orders.total_amount 저장
- 관리자 > 주문관리 실제 주문 목록 연결
  · 주문접수(new) / 준비중(preparing) / 배송중(shipping) / 배송완료(delivered) / 취소(cancelled)
  · 배송완료 변경 시 Supabase에 이미 설치한 배송완료 장부 트리거가 실행되는 구조
- 마이페이지 신규 추가 (/mypage)
  · 최근 주문내역 / 배송상태
  · 최근 결제내역
  · 세금계산서·계산서 상태
  · 미수금은 첫 화면에서 크게 노출하지 않음
  · 카드결제 버튼은 바로 보이게 배치
- 카드결제 화면 신규 추가 (/payment)
  · customer_balances의 현재 거래잔액 표시
  · 실제 PG 미연동 상태이므로 결제 버튼은 비활성/안내만 제공
- 로그인 계정 드롭다운 및 모바일 메뉴에 마이페이지 / 카드결제 연결

[Supabase에 이미 있어야 하는 항목]
- profiles, products, product_prices, orders, order_items
- payments, ledger_entries, tax_documents
- customer_balances View
- create_ledger_on_delivery() + orders status update trigger
- create_ledger_on_payment() + payments trigger

[주의]
- 카드 PG는 아직 연결하지 않았습니다.
- 전자세금계산서 API도 아직 연결하지 않았습니다.
- 실제 상품/가격 데이터 업로드는 별도 진행 항목입니다.
- 서버 환경변수 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 필요합니다.

[v29 운영 전 필수]
세금/매출 데이터 무결성을 위해 app/lib/supabase-v29.sql 을 Supabase SQL Editor에서 1회 실행한 뒤 실제 주문을 받으세요.
- 배송완료일(delivered_at) 기준 월별 세금자료
- 주문 당시 origin/tax_type 스냅샷
- 배송완료 후 임의 취소/상태 되돌림 방지
- 주문+주문품목 단일 DB 트랜잭션
- 중복 주문 방지 request_key
