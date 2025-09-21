// pages/api/click.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      userId = null,
      merchantId = null,
      linkId = null,
      source,
      url = null,
      referer = null,
      meta = null,
    } = (req.body ?? {}) as {
      userId?: string | null;
      merchantId?: string | null;
      linkId?: string | null;
      source: string;
      url?: string | null;
      referer?: string | null;
      meta?: Record<string, any> | null;
    };

    if (!source || typeof source !== 'string') {
      return res.status(400).json({ error: 'source is required (string)' });
    }

    // Pick up IP & UA from headers
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.socket as any)?.remoteAddress ||
      null;
    const userAgent = (req.headers['user-agent'] as string) || null;

    const created = await prisma.clickEvent.create({
      data: { userId, merchantId, linkId, source, url, referer, ip, userAgent, meta },
    });

    return res.status(201).json(created);
  } catch (err: any) {
    console.error('click api error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
