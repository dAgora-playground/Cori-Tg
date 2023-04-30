import { Bot } from "grammy";
import { config } from "dotenv";
import {
    mentionsBot,
    parseMessage,
    parseConfirmMessage,
} from "./telegram/index.js";
import { Attrs, useCrossbell } from "./handler/crossbell.js";
import { Network } from "crossbell.js";
import { confirmString } from "./const.js";
import { Activity, gptRequest } from "./handler/gpt.js";
import { config as settings } from "./config/index.js";

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

async function handleEvent(
    res: any,
    activity: Activity,
    result: any,
    ctx: any
) {
    try {
        const { time, location, topic } = activity;
        const eDate = new Date(time).toLocaleString("en-US", {
            timeZone: "Europe/Podgorica",
            timeStyle: "short",
            dateStyle: "medium",
        });

        const parsedData = `[Topic] ${topic} \n[Time] ${eDate} \n[Location] ${location}`;

        ctx.api.editMessageText(
            res.chat.id,
            res.message_id,
            `${parsedData}\nPushing to chain......`
        );

        const activityAttributes = [
            {
                trait_type: "location",
                value: location,
            },
            {
                trait_type: "time",
                display_type: "date",
                value: time,
            },
        ] as Attrs;

        if (result.channelName) {
            activityAttributes.push({
                trait_type: "telegram topic name",
                value: result.channelName,
            });
        }
        if (settings.crossbell) {
            const { characterId, noteId } = await useCrossbell(
                result.authorName,
                result.authorId,
                result.authorAvatar,
                result.banner,
                result.guildName,
                topic,
                result.publishedTime,
                result.labelingTags,
                result.content,
                result.attachments,
                result.curatorId,
                result.curatorUsername,
                result.curatorAvatar,
                result.curatorBanner,
                activityAttributes
            );
            ctx.api.editMessageText(
                res.chat.id,
                res.message_id,
                `${parsedData}\n✅ Material pushed to Crossbell! See:  https://crossbell.io/notes/${characterId}-${noteId}`
            );
        }
    } catch (e: any) {
        console.log(e.message);
        ctx.api.editMessageText(
            res.chat.id,
            res.message_id,
            "❌ Failed to push to Crossbell, please contact BOT administrator for assistance."
        );
    }
}

async function handleCuration(
    reply_to_message_id: number,
    result: any,
    ctx: any
) {
    const res = await ctx.reply("Collecting......", {
        reply_to_message_id,
    });

    try {
        if (settings.crossbell) {
            const { characterId, noteId } = await useCrossbell(
                result.authorName,
                result.authorId,
                result.authorAvatar,
                result.banner,
                result.guildName,
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
        }
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
    const thisMsg = ctx.message;
    if (!mentionsBot(thisMsg, botId)) return;

    const msg = thisMsg.reply_to_message;
    if (msg && !msg.forum_topic_created) {
        // we got a curation message
        const curationMsg = thisMsg;

        const result = parseMessage(curationMsg, botId, false);
        if (!result) return;

        if (msg.from?.id === curationMsg.from.id) {
            await handleCuration(msg.message_id, result, ctx);
        } else {
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
                    "\nTitle Suggestions: " +
                    result?.textWithoutTags +
                    "\nTag Suggestions: " +
                    result?.labelingTags.join("/"),
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        }
    } else {
        // we got an event message
        if (!thisMsg.text.includes("#event")) return;
        const result = parseMessage(thisMsg, botId, true);

        if (!result || !result.labelingTags.includes("event")) return;

        // if it is #event
        if (result.labelingTags.includes("event")) {
            const res = await ctx.reply("Parsing event data......", {
                reply_to_message_id: thisMsg.message_id,
            });

            let activity: Activity;
            if (settings.gpt) {
                const data = await gptRequest(
                    result.guildName + "\n" + result.content
                );
                if (!data || !data.time) return;
                activity = data;
            } else {
                activity = {
                    time: new Date().toISOString(),
                    location: "",
                    topic: "",
                };
            }

            await handleEvent(res, activity, result, ctx);
        }
    }
});

bot.on("message", async (ctx) => {
    const lastMsg = ctx.message.reply_to_message;
    if (!lastMsg || !lastMsg.text || !lastMsg.from?.is_bot) return;

    const result = parseConfirmMessage(ctx.message);

    if (lastMsg.text.includes(confirmString)) {
        handleCuration(lastMsg.message_id, result, ctx);
    }
});

async function main() {
    bot.start();
}

main();
