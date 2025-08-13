import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/email/sendVerificationEmail'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const started = Date.now()

  try {
    const body = await req.json().catch(() => ({} as any))
    const { name, email, password } = body as {
      name?: string; email?: string; password?: string
    }

    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { ok: false, error: 'missing_fields' },
        { status: 400 }
      )
    }

    // Ensure critical envs exist (loud fail if misconfigured)
    const needed = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXT_PUBLIC_BASE_URL', 'SENDGRID_API_KEY'] as const
    for (const k of needed) {
      if (!process.env[k]) {
        return NextResponse.json(
          { ok: false, error: `missing_env:${k}` },
          { status: 500 }
        )
      }
    }

    // Reject duplicate email
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { ok: false, error: 'email_in_use' },
        { status: 409 }
      )
    }

    // Create user
    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        emailVerified: false, // boolean field in your schema
      },
      select: { id: true, email: true },
    })

    // Create verification token (15 min)
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 15 * 60 * 1000)

    // relies on model VerificationToken (added below)
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
      },
    })

    // Send the email
    await sendVerificationEmail(user.email, token)

    return NextResponse.json({ ok: true, ms: Date.now() - started })
  } catch (err: any) {
    console.error('[signup] ERROR', {
      message: err?.message,
      name: err?.name,
      stack: err?.stack?.split('\n').slice(0, 6).join('\n'),
    })
    return NextResponse.json(
      { ok: false, error: 'signup_failed' },
      { status: 500 }
    )
  }
}
