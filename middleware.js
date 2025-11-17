// [파일 이름: middleware.js]

import { NextResponse } from 'next/server';

export const config = {
  // '/' (루트) 경로에만 미들웨어를 실행합니다.
  matcher: '/',
};

export function middleware(request) {
  try {
    // Vercel 헤더에서 국가 코드를 가져옵니다 (예: 'kr', 'us')
    const country = request.headers.get('x-vercel-ip-country')?.toLowerCase();

    // [✅ 핵심 수정]
    // request.url 대신, 더 안전한 request.nextUrl 객체를 복제합니다.
    const url = request.nextUrl.clone();

    // 국가 코드에 따라 URL의 경로(pathname)를 변경합니다.
    if (country === 'kr') {
      url.pathname = '/ko'; // 한국은 /ko 로
    } else {
      url.pathname = '/en'; // 그 외 모든 국가는 /en 으로
    }

    // 수정된 URL로 리디렉션 응답을 보냅니다.
    return NextResponse.redirect(url);

  } catch (error) {
    // 미들웨어 실행 중 에러가 나면, 콘솔에 기록하고
    // 만일을 대비해 영어 페이지로 보냅니다.
    console.error('Middleware Error:', error);
    const errorUrl = request.nextUrl.clone();
    errorUrl.pathname = '/en';
    return NextResponse.redirect(errorUrl);
  }
}
