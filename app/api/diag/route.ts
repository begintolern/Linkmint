import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export function GET() {
  const show = (k: string) => !!process.env[k]
  return NextResponse.json({
    up: true,
    env: {
      DATABASE_URL: show('DATABASE_URL'),
      NEXTAUTH_SECRET: show('NEXTAUTH_SECRET'),
      NEXT_PUBLIC_BASE_URL: show('NEXT_PUBLIC_BASE_URL'),
      SENDGRID_API_KEY: show('SENDGRID_API_KEY'),
    }
  })
}
