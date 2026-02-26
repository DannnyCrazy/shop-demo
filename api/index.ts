import { handle } from 'hono/vercel'

export const config = {
  runtime: 'nodejs'
}

// 使用动态 import 来导入 ES Module
const handler = async (req: any, res: any) => {
  const { default: app } = await import('../server/src/index')
  return handle(app)(req, res)
}

export default handler
