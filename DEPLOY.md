# 🚀 راهنمای Deploy

این پروژه با **Next.js 14** و **TypeScript** ساخته شده است.

## 📋 Deploy در Vercel

### مراحل:
1. به https://vercel.com بروید
2. New Project → Import از GitHub
3. انتخاب repository: `bozorgani/CMSAdmin`
4. Framework Preset: **Next.js**
5. Root Directory: `./`
6. **Environment Variables** (مهم!):

```
CMS_API_URL=https://your-backend-url.com
CMS_ENCRYPTION_KEY=<32-byte hex string>
TELEGRAM_BOT_TOKEN=<optional>
TELEGRAM_CHAT_ID=<optional>
ALLOWED_IPS=<optional>
TRUST_PROXY=true
```

7. Deploy!

## 🔧 Build Commands

```bash
# Development
npm install
npm run dev

# Production
npm install
npm run build
npm run start
```

## 📝 Scripts

- `npm run dev` - Development server (port 3001)
- `npm run build` - Production build
- `npm run start` - Production server (port 3001)
- `npm run lint` - ESLint
- `npm run type-check` - TypeScript check
- `npm run format` - Prettier

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CMS_API_URL` | ✅ | URL بک‌اند (مثلاً https://api.example.com) |
| `CMS_ENCRYPTION_KEY` | ✅ | کلید رمزنگاری 32 بایت hex |
| `TELEGRAM_BOT_TOKEN` | ❌ | توکن ربات تلگرام برای نوتیفیکیشن |
| `TELEGRAM_CHAT_ID` | ❌ | chat_id تلگرام |
| `ALLOWED_IPS` | ❌ | لیست IP های مجاز (با کاما جدا) |
| `TRUST_PROXY` | ❌ | true/false - اعتماد به X-Forwarded-For |

## 🆘 Troubleshooting

### صفحات باز نمی‌شوند
1. Environment Variables را بررسی کنید
2. Build Logs در Vercel را ببینید
3. Cache را پاک کنید: Vercel Dashboard → Deployments → Redeploy

### لاگین کار نمی‌کند
1. CMS_API_URL به backend درست اشاره می‌کند؟
2. Backend در دسترس است؟ (تلاش کنید curl کنید)
3. CMS_ENCRYPTION_KEY تنظیم شده؟
