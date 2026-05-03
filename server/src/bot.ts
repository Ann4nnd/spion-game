import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import type { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function trackUser(telegramId: string, firstName?: string, username?: string) {
  await prisma.botUser.upsert({
    where: { telegramId },
    create: { telegramId, firstName, username },
    update: { firstName, username, lastSeen: new Date() },
  });
}

export async function setupBot(
  server: FastifyInstance,
  token: string,
  appUrl: string
) {
  const bot = new Bot(token);
  const webAppUrl = appUrl || process.env.WEBAPP_URL || "";
  const adminId = process.env.ADMIN_TELEGRAM_ID;

  bot.command("start", async (ctx) => {
    if (ctx.from) {
      await trackUser(
        ctx.from.id.toString(),
        ctx.from.first_name,
        ctx.from.username
      ).catch((e) => console.error("trackUser error:", e));
    }

    const keyboard = new InlineKeyboard().webApp("🎮 Открыть игры", webAppUrl);

    await ctx.reply(
      "Добро пожаловать в *Пати Геймс*\\! 🎭\n\n" +
        "Игры для компании прямо в Telegram:\n" +
        "🕵️ *Шпион* — найди шпиона среди друзей\n" +
        "🔫 *Мафия* — классика с озвучкой ведущего\n" +
        "📝 *Слово дня* — Wordle на русском\n\n" +
        "Жми кнопку ниже\\!",
      {
        parse_mode: "MarkdownV2",
        reply_markup: keyboard,
      }
    );
  });

  bot.command("newgame", async (ctx) => {
    const keyboard = new InlineKeyboard().webApp("🎮 Создать игру", webAppUrl);
    await ctx.reply("Нажми кнопку, чтобы открыть игры:", {
      reply_markup: keyboard,
    });
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      "🎭 *Пати Геймс*\n\n" +
        "🕵️ *Шпион* — все знают локацию, кроме шпиона. Вычисли его\\!\n" +
        "🔫 *Мафия* — ночь, день, голосование\\. Доктор, комиссар и аудио\\-ведущий\\.\n" +
        "📝 *Слово дня* — угадай слово за 6 попыток\\. Каждый день новое\\.\n\n" +
        "*Команды:*\n" +
        "/start — Главное меню\n" +
        "/help — Эта справка",
      { parse_mode: "MarkdownV2" }
    );
  });

  // /myid — bot replies with user's Telegram ID (so admin can find theirs)
  bot.command("myid", async (ctx) => {
    if (!ctx.from) return;
    await ctx.reply(`Твой Telegram ID: \`${ctx.from.id}\``, {
      parse_mode: "MarkdownV2",
    });
  });

  // /broadcast — admin only. Sends message to all users with WebApp button.
  bot.command("broadcast", async (ctx) => {
    if (!ctx.from || !adminId || ctx.from.id.toString() !== adminId) {
      return; // silently ignore
    }

    const text = ctx.match?.toString().trim();
    if (!text) {
      await ctx.reply(
        "Использование: /broadcast <текст>\n\n" +
          "Пример:\n/broadcast 🎉 Новое! Добавили игру Слово Дня. Заходи скорее!"
      );
      return;
    }

    const users = await prisma.botUser.findMany();
    const total = users.length;
    await ctx.reply(`📤 Начинаю рассылку для ${total} пользователей...`);

    const keyboard = new InlineKeyboard().webApp("🎮 Открыть игру", webAppUrl);
    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await bot.api.sendMessage(user.telegramId, text, {
          reply_markup: keyboard,
        });
        sent++;
      } catch (e: any) {
        failed++;
        // 403 = user blocked the bot — common, ignore
        if (e?.error_code !== 403) {
          console.error(`Broadcast error to ${user.telegramId}:`, e?.description);
        }
      }
      // Telegram rate limit: ~30 msg/sec global. Stay safe at 25/sec.
      await new Promise((r) => setTimeout(r, 40));
    }

    await ctx.reply(
      `✅ Рассылка завершена\n\n` +
        `Отправлено: ${sent}\n` +
        `Не доставлено: ${failed}\n` +
        `Всего: ${total}`
    );
  });

  // /stats — admin only. Shows user count.
  bot.command("stats", async (ctx) => {
    if (!ctx.from || !adminId || ctx.from.id.toString() !== adminId) return;
    const total = await prisma.botUser.count();
    const last7days = await prisma.botUser.count({
      where: {
        lastSeen: { gte: new Date(Date.now() - 7 * 86400000) },
      },
    });
    await ctx.reply(
      `📊 Статистика бота\n\n` +
        `Всего пользователей: ${total}\n` +
        `Активных за 7 дней: ${last7days}`
    );
  });

  bot.on("message", async (ctx) => {
    if (ctx.from) {
      await trackUser(
        ctx.from.id.toString(),
        ctx.from.first_name,
        ctx.from.username
      ).catch(() => {});
    }
    const keyboard = new InlineKeyboard().webApp("🎮 Открыть игры", webAppUrl);
    await ctx.reply("Нажми кнопку, чтобы открыть игры:", {
      reply_markup: keyboard,
    });
  });

  if (appUrl) {
    // Production: webhooks
    const webhookPath = `/bot${token}`;
    server.post(webhookPath, webhookCallback(bot, "fastify"));
    await bot.api.setWebhook(`${appUrl}${webhookPath}`);
    console.log(`Bot webhook set to ${appUrl}${webhookPath}`);
  } else {
    // Development: polling
    bot.start({
      onStart: (botInfo) => {
        console.log(`Bot @${botInfo.username} started (polling)`);
      },
    });
  }
}
