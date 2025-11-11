import { NextResponse } from 'next/server';

export function middleware(request) {
  const p = request.nextUrl.pathname;
  // Allow OneSignal worker files to be served directly
  if (p === '/OneSignalSDKWorker.js' || p === '/OneSignalSDKUpdaterWorker.js') {
    return NextResponse.next();
  }
  // ...existing middleware logic...
  return NextResponse.next();
}