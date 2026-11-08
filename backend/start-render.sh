set -e
touch /var/data/dev.db
npx prisma migrate deploy --config prisma7.config.ts
node --import tsx src/seed.ts
exec node --import tsx src/server.ts