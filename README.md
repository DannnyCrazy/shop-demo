# Shop Demo (Vercel Postgres)

本项目已将后端数据存储迁移到 Vercel Postgres。下面是最小可用的部署与迁移指引（仅需修改变量即可）。

## 1. 创建并绑定 Vercel Postgres

1. Vercel Dashboard → Storage → Postgres → New Database
2. 绑定到当前项目
3. 获取连接串（`POSTGRES_URL` 或 `DATABASE_URL`）

## 2. 本地执行数据迁移（SQLite → Postgres）

> 迁移脚本会读取 `shop.sqlite` 并写入 Postgres。

### Windows (cmd)

```cmd
set POSTGRES_URL=你的VercelPostgres连接串
set SQLITE_PATH=f:\Code\shop-demo\shop.sqlite
set RESET_EXISTING=1
npm run migrate:postgres
```

### 变量说明

- `POSTGRES_URL`: Vercel Postgres 连接串
- `SQLITE_PATH`: SQLite 文件路径（默认 `shop.sqlite`）
- `RESET_EXISTING`: `1` 表示迁移前清空目标表

## 3. 部署到 Vercel

- `vercel.json` 已移除 `shop.sqlite` 的 `includeFiles`
- `api/handler.ts` 使用 `runtime: "nodejs"`
- Vercel 会自动注入 `POSTGRES_URL`（绑定数据库后）

## 4. 本地开发

- 未设置 `POSTGRES_URL` 时会自动使用内存数据库（仅开发用）
- 设置 `POSTGRES_URL` 可直接连接 Postgres

## 执行脚本（仅改变量即可）

- `scripts/migrate-postgres.cmd`: SQLite → Postgres 迁移

## 常见问题

- 如果迁移失败，请确认 Postgres 已创建并且连接串有效。
- 如果需要重新导入，设置 `RESET_EXISTING=1`。
