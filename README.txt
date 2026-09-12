신농허브 Next.js v4

수정사항
1. 메인 하단 SCROLL DOWN 요소 삭제
2. 회사소개 본문 3개 문단의 강제 줄바꿈 제거
3. 메인 타이틀 '좋은 내일을 만듭니다.'가 한 줄로 유지되도록 조정
4. 회사소개 핵심가치 5개 항목의 크기/정렬 통일 + 엄선된 원료/함께하는 성장 설명 한 줄 처리
5. 오시는 길의 CSS 약도를 실제 카카오맵 연동 컴포넌트로 교체

카카오맵 설정
- Kakao Developers에서 JavaScript 키를 발급합니다.
- 사용할 Vercel 도메인과 최종 도메인을 JavaScript SDK 도메인에 등록합니다.
- Vercel > Project Settings > Environment Variables에 아래 값을 추가합니다.
  NEXT_PUBLIC_KAKAO_MAP_APP_KEY=발급받은_JavaScript_키
- 재배포하면 오시는 길 페이지에 실제 카카오맵이 표시됩니다.

라우트
/                     메인
/company              회사소개
/company/history      연혁
/company/location     오시는 길
