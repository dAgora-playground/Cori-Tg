import { Bot } from "grammy";
import { config } from "dotenv";
import {
    mentionsBot,
    parseMessage,
    parseConfirmMessage,
} from "./telegram/index.js";
import { useCrossbell } from "./handler/crossbell.js";
import { Network } from "crossbell.js";
import { confirmString } from "./const.js";
import { gptRequest } from "./handler/gpt.js";

config();

//Localhost
if (process.env.CROSSBELL_RPC_ADDRESS === "http://127.0.0.1:8545") {
    const info = Network.getCrossbellMainnetInfo();
    info.chainId = 31337;
    Network.getCrossbellMainnetInfo = () => info;
}
//Localhost End

const botToken = process.env["botToken"] || "";
const botId = process.env["botId"] || "";

const bot = new Bot(botToken);

// Handle the /start command.
bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

async function handle(reply_to_message_id: number, result: any, ctx: any) {
    const res = await ctx.reply("Collecting......", {
        reply_to_message_id,
    });

    try {
        // gpt request
        if (result.content.includes("#event")) {
            const activity = await gptRequest((result.guildName + '\n' + result.content));
            ctx.api.editMessageText(
                res.chat.id,
                res.message_id,
                `[Topic] ${activity.topic} \n[Time] ${activity.time} \n[Location] ${activity.location}`
            );
        }

        const { characterId, noteId } = await useCrossbell(
            result.authorName,
            result.authorId,
            result.authorAvatar,
            result.banner,
            result.guildName,
            result.channelName,
            result.title,
            result.publishedTime,
            result.labelingTags,
            result.content,
            result.attachments,
            result.curatorId,
            result.curatorUsername,
            result.curatorAvatar,
            result.curatorBanner
        );
        ctx.api.editMessageText(
            res.chat.id,
            res.message_id,
            `✅ Material pushed to Crossbell! See:  https://crossbell.io/notes/${characterId}-${noteId}`
        );
    } catch (e: any) {
        console.log(e.message);
        ctx.api.editMessageText(
            res.chat.id,
            res.message_id,
            "❌ Failed to push to Crossbell, please contact BOT administrator for assistance."
        );
    }
}
// Handle other messages.
bot.on("message:entities:mention", async (ctx) => {
    const curationMsg = ctx.message;
    const msg = ctx.message.reply_to_message;
    if ((!msg || !msg.from) && (!ctx.message.text.includes('#event')) ) return;
    if (!mentionsBot(curationMsg, botId)) return;

    const result = await parseMessage(curationMsg);
    if (!result) return;
    
    // if it is #event
    if (result?.content?.includes("#event")) {
        await handle(ctx.message.message_id, result, ctx);
    }

    // save quotation to crossbell
    if (!msg || !msg.from) return;
    if (msg.from.id === curationMsg.from.id) {
        await handle(msg.message_id, result, ctx);
    } else if (!result.content?.includes("#event")) {
        ctx.reply(
            curationMsg.from.first_name +
                (curationMsg.from.username
                    ? "(@" + curationMsg.from.username + ")"
                    : "") +
                confirmString +
                " Reply 'OK' (or anything) to confirm \nNote: " +
                msg.text +
                "\nPublished Time: " +
                result.publishedTime +
                "\nTag Suggestions: " +
                result?.labelingTags.join("/"),
            {
                reply_to_message_id: msg.message_id,
            }
        );
    }
});

bot.on("message", async (ctx) => {
    const lastMsg = ctx.message.reply_to_message;
    if (!lastMsg || !lastMsg.text || !lastMsg.from?.is_bot) return;

    const result = parseConfirmMessage(ctx.message);

    if (lastMsg.text.includes(confirmString)) {
        handle(lastMsg.message_id, result, ctx);
    }
});

async function main() {
    bot.start();
}

main();
