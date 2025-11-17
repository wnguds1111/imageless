// [파일 이름: middleware.js]

import { NextResponse } from 'next/server';

export const config = {
  // 미들웨어를 실행할 경로를 지정합니다.
  // '/' (루트 경로)에만 적용합니다.
  matcher: '/', 
};

export function middleware(request) {
  // Vercel이 제공하는 헤더에서 국가 코드를 가져옵니다. (예: 'KR', 'US')
  const country = request.headers.get('x-vercel-ip-country')?.toLowerCase();

  let urlToRedirect;

  if (country === 'kr') {
    // 국가 코드가 'kr'이면 /ko 경로로 리디렉션
    urlToRedirect = new URL('/ko', request.url);
  } else {
    // 그 외 모든 국가(미국, 유럽, 봇 등)는 /en 경로로 리디렉션
    urlToRedirect = new URL('/en', request.url);
  }

  // 해당 경로로 사용자를 리디렉션시킵니다.
  return NextResponse.redirect(urlToRedirect);
}
