// Notification service - sends alerts via Telegram
// Email notifications would require SMTP setup, so we use Telegram as primary

interface NotifyOptions {
  type: 'login_success' | 'login_failed' | '2fa_enabled' | '2fa_disabled' | 'suspicious_activity';
  user?: string;
  ip?: string;
  userAgent?: string;
  details?: string;
}

const NOTIFY_ICONS: Record<NotifyOptions['type'], string> = {
  login_success: '✅',
  login_failed: '❌',
  '2fa_enabled': '🔐',
  '2fa_disabled': '⚠️',
  suspicious_activity: '🚨',
};

const NOTIFY_TITLES: Record<NotifyOptions['type'], string> = {
  login_success: 'ورود موفق',
  login_failed: 'تلاش ناموفق',
  '2fa_enabled': '۲FA فعال شد',
  '2fa_disabled': '۲FA غیرفعال شد',
  suspicious_activity: 'فعالیت مشکوک',
};

function formatMessage(options: NotifyOptions): string {
  const icon = NOTIFY_ICONS[options.type];
  const title = NOTIFY_TITLES[options.type];
  const time = new Date().toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' });

  let msg = `${icon} *${title}*\n`;
  msg += `🕐 ${time}\n`;
  if (options.user) msg += `👤 کاربر: \`${options.user}\`\n`;
  if (options.ip) msg += `🌐 IP: \`${options.ip}\`\n`;
  if (options.userAgent) msg += `💻 دستگاه: \`${options.userAgent.slice(0, 50)}...\`\n`;
  if (options.details) msg += `📝 ${options.details}\n`;

  return msg;
}

/**
 * Send notification via Telegram bot
 * Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID env vars
 */
export async function notify(options: NotifyOptions): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    // Silently fail - notifications are optional
    return false;
  }

  try {
    const message = formatMessage(options);
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error('Telegram notification failed:', await response.text());
      return false;
    }
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Telegram notification error:', error);
    return false;
  }
}
