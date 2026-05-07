import { FastifyRequest, FastifyReply } from 'fastify'

export interface AdminJwtPayload {
  id: string
  email: string
  name: string
}

declare module 'fastify' {
  interface FastifyRequest {
    admin?: AdminJwtPayload
  }
}

export async function adminAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const token = request.cookies.admin_token

    if (!token) {
      return reply.status(401).send({ error: 'Authentication required' })
    }

    const decoded = await request.jwtVerify<AdminJwtPayload>()
    request.admin = decoded
  } catch (err) {
    return reply.status(401).send({ error: 'Invalid or expired token' })
  }
}