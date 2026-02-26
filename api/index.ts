import { handle } from 'hono/vercel'

export const config = {
  runtime: 'nodejs'
}

// 使用动态 import 来导入 ES Module
const handler = async (req: Request) => {
  const { default: app } = await import('../server/src/index')
  return handle(app)(req)
}

export default handler
