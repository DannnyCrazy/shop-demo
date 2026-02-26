import { handle } from 'hono/vercel'

export const config = {
  runtime: 'nodejs'
}

const handler = async (req: any, res: any) => {
  const { default: app } = await import('../server/src/index')
  return handle(app)(req, res)
}

export default handler
