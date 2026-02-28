@echo off
setlocal

REM ==== 仅需修改以下变量 ====
set "POSTGRES_URL=postgres://postgres.tifvdzlypoccruwaciwn:EY93BjIynLkaOqtg@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
set "SQLITE_PATH=f:\Code\shop-demo\shop.sqlite"
set "RESET_EXISTING=1"
REM ========================

npm run migrate:postgres

endlocal
