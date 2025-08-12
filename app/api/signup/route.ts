import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const started = Date.now()
  console.log('[signup] start', { ts: started })

  try {
    const body = await req.json().catch(() => ({}))
    console.log('[signup] body keys', Object.keys(body))

    // sanity checks to catch missing envs early (don’t log secrets)
    const needed = ['DATABASE_URL','NEXTAUTH_SECRET','NEXT_PUBLIC_BASE_URL']
    const envStatus = Object.fromEntries(needed.map(k => [k, !!process.env[k]]))
    console.log('[signup] envStatus', envStatus)

    // … your existing signup code …
    // e.g., create user, send email, etc.

    console.log('[signup] ok in', Date.now() - started, 'ms')
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[signup] ERROR', {
      message: err?.message,
      name: err?.name,
      stack: err?.stack?.split('\n').slice(0,6).join('\n'),
    })
    return NextResponse.json({ ok: false, error: 'signup_failed' }, { status: 500 })
  }
}
