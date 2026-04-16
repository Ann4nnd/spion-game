import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });

import { Bot, InlineKeyboard } from "grammy";

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("BOT_TOKEN is not set in environment variables");
}

const webAppUrl = process.env.WEBAPP_URL || "https://localhost:5173";
const bot = new Bot(token);

bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard().webApp("Играть в Шпиона", webAppUrl);

  await ctx.reply(
    "Добро пожаловать в игру *Шпион*\\! 🕵️\n\n" +
      "Нажми кнопку ниже, чтобы начать игру\\.\n\n" +
      "*Два режима:*\n" +
      "🌐 *Онлайн* — каждый на своём устройстве\n" +
      "📱 *Одно устройство* — передавайте телефон по кругу",
    {
      parse_mode: "MarkdownV2",
      reply_markup: keyboard,
    }
  );
});

bot.command("newgame", async (ctx) => {
  const keyboard = new InlineKeyboard().webApp("Создать игру", webAppUrl);

  await ctx.reply("Нажми кнопку, чтобы создать новую игру:", {
    reply_markup: keyboard,
  });
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "🕵️ *Как играть в Шпиона:*\n\n" +
      "1\\. Все игроки получают одну локацию, кроме шпиона\n" +
      "2\\. Игроки по очереди задают друг другу вопросы\n" +
      "3\\. Цель обычных игроков — вычислить шпиона\n" +
      "4\\. Цель шпиона — угадать локацию\n" +
      "5\\. После обсуждения — голосование\n\n" +
      "*Команды:*\n" +
      "/start — Главное меню\n" +
      "/newgame — Создать новую игру\n" +
      "/help — Эта справка",
    { parse_mode: "MarkdownV2" }
  );
});

bot.on("message", async (ctx) => {
  const keyboard = new InlineKeyboard().webApp("Открыть игру", webAppUrl);
  await ctx.reply("Нажми кнопку, чтобы открыть игру:", {
    reply_markup: keyboard,
  });
});

bot.start({
  onStart: (botInfo) => {
    console.log(`Bot @${botInfo.username} started`);
    console.log(`WebApp URL: ${webAppUrl}`);
  },
});
