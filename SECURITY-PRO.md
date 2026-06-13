# راهنمای امنیت حرفه‌ای - فقط برای شما

این سند تمام لایه‌های امنیتی پیاده‌سازی شده را مستند می‌کند.

## 🛡️ معماری امنیتی ۷ لایه

### لایه ۱: IP Allowlist (محدودیت IP)
```typescript
// middleware.ts
const ALLOWED_IPS = process.env.ALLOWED_IPS?.split(',') || [];
// فقط IP های مشخص شده اجازه دسترسی دارند
```

**نحوه استفاده:**
```bash
# در .env.local - لیست IP های مجاز (با کاما جدا کنید)
ALLOWED_IPS=1.2.3.4,5.6.7.8
```

### لایه ۲: Rate Limiting (ضد Brute Force)
```typescript
// ۵ تلاش ناموفق → ۳۰ دقیقه قفل
const rateCheck = checkRateLimit(`login:${ip}:${email}`, {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  lockoutMs: 30 * 60 * 1000,
});
```

### لایه ۳: رمز عبور (Backend Authentication)
- رمز عبور توسط backend تأیید می‌شود
- HttpOnly Cookie برای توکن
- ۴ ساعت اعتبار session

### لایه ۴: TOTP 2FA (Google Authenticator) 🔐
```typescript
// RFC 6238 - TOTP با HMAC-SHA1
const code = generateTOTP(secret, Date.now()); // 6 رقم، ۳۰ ثانیه
verifyTOTP(secret, code, window=1); // ±۳۰ ثانیه تحمل
```

**ویژگی‌ها:**
- ✅ سازگار با Google Authenticator، Authy، 1Password
- ✅ کدهای پشتیبان (Backup Codes)
- ✅ Secret با AES-256-GCM رمزنگاری شده
- ✅ فقط خودتان می‌توانید فعال/غیرفعال کنید

### لایه ۵: نوتیفیکیشن تلگرام 📱
```typescript
// هر ورود موفق/ناموفق → پیام تلگرام
await notify({
  type: 'login_success',
  user: email,
  ip: '1.2.3.4',
  userAgent: '...',
  details: 'با 2FA',
});
```

**نمونه پیام:**
```
✅ ورود موفق
🕐 ۱۴۰۳/۰۳/۱۵ - ۱۴:۳۰
👤 کاربر: admin@example.com
🌐 IP: 1.2.3.4
💻 دستگاه: Chrome 120 / Windows
📝 با 2FA
```

### لایه ۶: Audit Log (لاگ تمام تلاش‌ها)
- تمام ورودها (موفق/ناموفق)
- تغییرات 2FA (فعال/غیرفعال)
- فعالیت‌های مشکوک
- ارسال به تلگرام

### لایه ۷: Session Security
```typescript
// Security Headers
'X-Content-Type-Options': 'nosniff',
'X-Frame-Options': 'DENY',
'X-XSS-Protection': '1; mode=block',
'Referrer-Policy': 'strict-origin-when-cross-origin',
'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
```

## 🚀 راه‌اندازی

### مرحله ۱: تنظیم فایل `.env.local`

```bash
# کپی کنید:
cp .env.example .env.local

# ۱. کلید رمزنگاری (الزامی)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# خروجی را در CMS_ENCRYPTION_KEY قرار دهید

# ۲. IP خودتان (اختیاری ولی توصیه شده)
# پیدا کردن IP: https://whatismyip.com
ALLOWED_IPS=YOUR.IP.ADDRESS.HERE

# ۳. ربات تلگرام (اختیاری ولی توصیه شده)
# ۱) به @BotFather بروید و /newbot بزنید
# ۲) توکن را کپی کنید
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# ۳) به @userinfobot پیام بدهید تا chat_id را بدست آورید
TELEGRAM_CHAT_ID=987654321
```

### مرحله ۲: فعال‌سازی 2FA

```
۱. وارد پنل شوید (با ایمیل و رمز عبور)
۲. به تنظیمات → تنظیمات امنیتی بروید
۳. روی "فعال‌سازی ۲FA" کلیک کنید
۴. Google Authenticator را نصب کنید (از Play Store/App Store)
۵. کد QR را اسکن کنید
۶. کد ۶ رقمی را وارد کنید و تأیید کنید
۷. کدهای پشتیبان را دانلود و در جای امن نگهداری کنید
```

### مرحله ۳: تست امنیت

```bash
# ۱. تست IP Allowlist
curl -X POST http://localhost:3001/api/auth/login -d '{}'
# اگر IP شما allow نیست → 403

# ۲. تست Rate Limiting
# ۵ بار با رمز اشتباه وارد کنید → ۳۰ دقیقه قفل

# ۳. تست 2FA
# بدون کد TOTP → 401
# با کد اشتباه → 401
# با کد صحیح → موفقیت ✅
```

## 🔐 جریان کامل Login

```
1. کاربر → POST /api/auth/login { email, password }
   ↓
2. Middleware → بررسی IP Allowlist
   ↓
3. Rate Limiter → بررسی تعداد تلاش‌ها
   ↓
4. Backend → بررسی ایمیل و رمز عبور
   ↓ (اگر موفق)
5. بررسی TOTP Cookie → آیا 2FA فعال است؟
   ↓ (بله)
6. کاربر → POST /api/auth/login { email, password, totpCode }
   ↓
7. Verify TOTP → بررسی کد ۶ رقمی
   ↓ (معتبر)
8. Set HttpOnly Cookie → توکن نهایی
   ↓
9. Telegram Notification → اطلاع‌رسانی
   ↓
10. Dashboard ✅
```

## 🆘 بازیابی دسترسی

### اگر کد 2FA را از دست دادید:

```bash
# از کدهای پشتیبان (Backup Codes) استفاده کنید
# اگر کدهای پشتیبان را هم ندارید:
# ۱. به settings/security بروید
# ۲. در انتها "غیرفعال‌سازی ۲FA" را باز کنید
# ۳. اگر نمی‌توانید وارد شوید:
#    - حذف cms-totp-secret cookie (از DevTools)
#    - یا پاک کردن .next/cache و restart
```

### اگر IP شما عوض شد:

```bash
# گزینه ۱: IP جدید را در .env.local اضافه کنید
ALLOWED_IPS=1.2.3.4,5.6.7.8  # قبلی و جدید

# گزینه ۲: موقتاً Allowlist را خالی بگذارید
ALLOWED_IPS=
```

### اگر کلید رمزنگاری را از دست دادید:

```bash
# ⚠️ تمام تنظیمات 2FA باید دوباره انجام شود
# ۱. کلید جدید تولید کنید
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ۲. در .env.local قرار دهید
CMS_ENCRYPTION_KEY=new_key_here

# ۳. به settings/security بروید و دوباره 2FA را فعال کنید
```

## 📊 مقایسه امنیت

| تهدید | قبل | بعد |
|-------|-----|-----|
| Brute Force Password | ❌ آسیب‌پذیر | ✅ ۵ تلاش → ۳۰ دقیقه قفل |
| Stolen Password | ❌ ورود ممکن | ✅ بدون کد TOTP غیرممکن |
| XSS Attack | ❌ توکن در localStorage | ✅ توکن در HttpOnly |
| CSRF Attack | ❌ آسیب‌پذیر | ✅ SameSite=Lax |
| Unknown IP | ❌ قابل دسترسی | ✅ بسته شده |
| Session Hijacking | 🟡 متوسط | ✅ کوتاه‌تر + notif |
| Stolen Cookie | 🟡 متوسط | ✅ Secure + HttpOnly |

## 📝 یادداشت‌های مهم

1. **حتماً `.env.local` را ایجاد کنید** - بدون `CMS_ENCRYPTION_KEY` کل سیستم کار نمی‌کند
2. **کلید رمزنگاری را تغییر ندهید** - در غیر این صورت تمام TOTP ها باطل می‌شوند
3. **کدهای پشتیبان را در جای امن نگهداری کنید** - مثل Password Manager
4. **تلگرام را تنظیم کنید** - حتی اگر اختیاری است، برای امنیت بیشتر لازم است
5. **IP خود را در ALLOWED_IPS قرار دهید** - بسته به ISP ممکن است تغییر کند
