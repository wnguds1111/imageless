// [파일 이름: middleware.js]

import { NextResponse } from 'next/server';

export const config = {
  // ✅ [수정]
  // 복잡한 정규식 대신, 오직 '/' (루트) 경로에서만
  // 이 함수를 실행하도록 설정합니다.
  matcher: '/',
};

export function middleware(request) {
  // 이 함수는 '/' 경로로 접속했을 때 "단 한 번만" 실행됩니다.
  
  // 1. 국가 코드를 가져옵니다.
  const country = request.headers.get('x-vercel-ip-country')?.toLowerCase();
  
  // 2. 리디렉션할 URL 객체를 생성합니다.
  const url = request.nextUrl.clone();

  // 3. 국가 코드에 따라 경로를 설정합니다.
  if (country === 'kr') {
    url.pathname = '/ko'; // 한국은 /ko 로
  } else {
    url.pathname = '/en'; // 그 외 모든 국가는 /en 으로
  }
  
  // 4. /ko 또는 /en 으로 "단 한 번" 리디렉션합니다.
  // 사용자가 /ko 로 이동한 뒤에는, 이 함수는 
  // matcher가 '/'가 아니므로 다시 실행되지 않습니다. (무한 루프 100% 방지)
  return NextResponse.redirect(url);
}
