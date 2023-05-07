import { Bot } from "grammy";
import { config } from "dotenv";
import {
    mentionsBot,
    parseMessage,
    parseConfirmMessage,
    ParsedResult,
    parseBasicMessage,
    MessageBase,
} from "./telegram/index.js";
import { Attrs, useCrossbell } from "./handler/crossbell.js";
import { Network } from "crossbell.js";
import { confirmString } from "./const.js";
import { Activity, gptRequest } from "./handler/gpt.js";
import { config as settings } from "./config/index.js";
import { Message } from "grammy/types";
import { addKeyValue, loadKeyValuePairs } from "./utils/keyValueStore.js";

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
    result: ParsedResult,
    ctx: any
) {
    try {
        const { time, location, topic } = activity;

        const eDate = new Date(time).toLocaleString("en-US", {
            timeZone: "Europe/Podgorica",
            timeStyle: "short",
            dateStyle: "medium",
        });

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

        result.title = topic;

        const parsedData = `[Topic] ${topic} \n[Time] ${eDate} \n[Location] ${location}`;

        ctx.api.editMessageText(
            res.chat.id,
            res.message_id,
            `${parsedData}\nPushing to chain......`
        );

        if (result.channelName) {
            activityAttributes.push({
                trait_type: "telegram topic name",
                value: result.channelName,
            });
        }
        if (settings.crossbell) {
            const { characterId, noteId } = await useCrossbell(result, {
                attributes: activityAttributes,
            });
            ctx.api.editMessageText(
                res.chat.id,
                res.message_id,
                `${parsedData}\n✅ Material pushed to Crossbell! See:  https://crossbell.io/notes/${characterId}-${noteId}`
            );
            return { characterId, noteId };
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
    result: ParsedResult,
    ctx: any
) {
    const res = await ctx.reply("Collecting......", {
        reply_to_message_id,
    });

    try {
        if (settings.crossbell) {
            const { characterId, noteId } = await useCrossbell(result);
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

async function handleEventReply(reply2: NoteId, result: MessageBase, ctx: any) {
    try {
        if (settings.crossbell) {
            await useCrossbell(result, {
                reply2,
            });
        }
    } catch (e: any) {
        console.log(e.message);
    }
}

const eventMsgIds = new Map<string, string>();
export interface NoteId {
    characterId: number;
    noteId: number;
}

function isReply2SomeOne(msg: Message) {
    const replyingMsg = msg.reply_to_message;
    return replyingMsg && !replyingMsg.forum_topic_created;
}

const makeMsgId = (msg: Message) => `${msg.chat.id}-${msg.message_id}`;

// Handle other messages.
bot.on("message:entities:mention", async (ctx) => {
    const thisMsg = ctx.message;
    if (!mentionsBot(thisMsg, botId)) return;

    const msg = thisMsg.reply_to_message;
    // is replying to someone, other than the "topic"

    if (isReply2SomeOne(thisMsg)) {
        // we got a curation message
        const curationMsg = thisMsg;

        const result = parseMessage(curationMsg, botId, false);
        if (!result) return;

        const { from, message_id, text } = msg!;
        if (from?.id === curationMsg.from.id) {
            await handleCuration(message_id, result, ctx);
        } else {
            ctx.reply(
                curationMsg.from.first_name +
                    (curationMsg.from.username
                        ? "(@" + curationMsg.from.username + ")"
                        : "") +
                    confirmString +
                    " Reply 'OK' (or anything) to confirm \nNote: " +
                    text +
                    "\nPublished Time: " +
                    result.publishedTime +
                    "\nTitle Suggestions: " +
                    result?.textWithoutTags +
                    "\nTag Suggestions: " +
                    result?.labelingTags?.join("/"),
                {
                    reply_to_message_id: message_id,
                }
            );
        }
    } else {
        // we got an event message
        if (!thisMsg.text.includes("#event")) return;
        const result = parseMessage(thisMsg, botId, true);

        if (!result || !result.labelingTags?.includes("event")) return;

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

            const data = await handleEvent(res, activity, result, ctx);
            // record event message id
            const msgId = makeMsgId(thisMsg);
            if (data) eventMsgIds.set(msgId, JSON.stringify(data));
            // add (msgId, data) to a file
            await addKeyValue(msgId, JSON.stringify(data)).catch(console.log);
        }
    }
});

export function isUsefulReply(thisMsg: Message) {
    const lastMsg = thisMsg.reply_to_message;

    let reply2: "event" | "confirmMsg" | null = null;
    if (!isReply2SomeOne(thisMsg)) return;

    const { text, from } = lastMsg!;

    if (lastMsg!.text?.includes("#event") && lastMsg!.text?.includes(botId)) {
        reply2 = "event";
    } else if (from?.is_bot && text?.includes(confirmString)) {
        reply2 = "confirmMsg";
    }

    return reply2;
}

bot.on("message", async (ctx) => {
    const thisMsg = ctx.message;
    const reply2 = isUsefulReply(thisMsg);
    if (!reply2) return;
    if (reply2 === "event") {
        let noteIdStr = eventMsgIds.get(makeMsgId(thisMsg.reply_to_message!));
        if (noteIdStr) {
            const noteId = JSON.parse(noteIdStr);
            const result = parseBasicMessage(ctx.message);
            if (!result) return;
            handleEventReply(noteId, result, ctx);
        }
    } else if (reply2 === "confirmMsg") {
        const result = parseConfirmMessage(ctx.message);
        if (!result) return;
        handleCuration(thisMsg.reply_to_message!.message_id, result, ctx);
    }
});

async function main() {
    // initialize eventMsgIds
    await loadKeyValuePairs(eventMsgIds);
    bot.start();
}

main();
