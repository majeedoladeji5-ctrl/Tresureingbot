require('dotenv').config();
const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN is not set. Add it to your .env file or Railway variables.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply(
    `👋 Welcome to Treasureingbot!\n\n` +
    `I'm a dictionary bot. Send me any word and I'll give you its definition.\n\n` +
    `Try: "hello" or use /define hello`
  );
});

bot.help((ctx) => {
  ctx.reply(
    `📖 How to use me:\n` +
    `• Just type a word and I'll define it\n` +
    `• Or use /define <word>\n` +
    `Example: /define serendipity`
  );
});

bot.command('define', async (ctx) => {
  const word = ctx.message.text.split(' ').slice(1).join(' ').trim();
  if (!word) {
    return ctx.reply('Please provide a word. Example: /define happiness');
  }
  await lookupWord(ctx, word);
});

bot.on('text', async (ctx) => {
  const text = ctx.message.text.trim();
  if (text.startsWith('/')) return;
  await lookupWord(ctx, text);
});

async function lookupWord(ctx, word) {
  try {
    ctx.sendChatAction('typing');
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );

    if (!res.ok) {
      return ctx.reply(`❌ Couldn't find a definition for "${word}". Check the spelling and try again.`);
    }

    const data = await res.json();
    const entry = data[0];

    let reply = `📚 *${entry.word}*\n`;
    if (entry.phonetic) reply += `🔊 ${entry.phonetic}\n`;

    entry.meanings.slice(0, 3).forEach((meaning) => {
      reply += `\n_${meaning.partOfSpeech}_\n`;
      meaning.definitions.slice(0, 2).forEach((def, i) => {
        reply += `${i + 1}. ${def.definition}\n`;
        if (def.example) reply += `   e.g. "${def.example}"\n`;
      });
    });

    ctx.replyWithMarkdown(reply);
  } catch (err) {
    console.error('Lookup error:', err.message);
    ctx.reply('⚠️ Something went wrong looking that up. Please try again in a moment.');
  }
}

bot.catch((err, ctx) => {
  console.error(`Bot error for ${ctx.updateType}:`, err);
});

bot.launch().then(() => {
  console.log('✅ Treasureingbot is running...');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
