import { Bot } from "grammy";
import { Message } from "grammy/types";
import { text } from "stream/consumers";
import { confirmString } from "../const.js";

export function mentionsBot(m: Message, id: string) {
    const text = m.text;
    if (!text) return false;
    const mentions = m.entities
        ?.map((e) => {
            if (e.type === "mention") {
                return text.slice(e.offset, e.offset + e.length);
            }
        })
        .filter((i) => !!i);
    return !!mentions?.includes(id);
}

export function extractTags(m: Message) {
    if (!m.text) return [];
    let text = m.text;
    const fragments = m.entities?.filter((t) => t.type === "mention");
    fragments?.map((f) => {
        text =
            text.substring(0, f.offset) +
            text.substring(f.offset + f.length + 1);
    });

    return text.split(/,|，|\//).map((t) => t.trim());
}

export async function parseMessage(m: Message) {
    if (m.chat.type === "private") return null;
    if (!m.text) return null;
    if (!m.from) return null;
    let msg;

    if (m.text.includes('#event')) {
        msg = m;
    } else {
        msg = m.reply_to_message;
    }
    if (!msg || !msg.from) return;

    // TODO: https://stackoverflow.com/questions/36733263/how-do-i-get-the-user-picture-avatar-using-the-telegram-bot-chat-api
    // var user_profile = bot.api.getUserProfilePhotos(msg.from.id);
    // user_profile.then(function (res) {
    //     var file_id = res.photos[0][0].file_id;
    //     var file = bot.api.getFile(file_id);
    //     file.then(function (result) {
    //         var file_path = result.file_path;
    //         var photo_url = `https://api.telegram.org/file/bot${process.env.botToken}/${file_path}`;
    //         console.log(photo_url);
    //     });
    // });

    const labelingTags = extractTags(m);

    return {
        labelingTags,
        authorName: msg?.from?.first_name,
        authorId: msg?.from?.username || msg?.from?.first_name,
        authorAvatar: "",
        banner: "",
        guildName: m.chat.title,
        channelName: "", //TODO
        title: "",
        publishedTime: new Date(msg.date * 1000).toUTCString(),
        content: msg.text,
        attachments: [], //TODO
        curatorId: m.from.username || m.from.first_name,
        curatorUsername: m.from.first_name,
        curatorAvatar: "",
        curatorBanner: "",
    };
}

export function parseConfirmMessage(m: Message) {
    console.log(m);
    if (m.chat.type === "private") return null;
    if (!m.text) return null;
    if (!m.from) return null;

    const msg = m.reply_to_message;
    if (!msg || !msg.from || !msg.text) return;
    const mention = msg.entities?.find((e) => e.type === "mention");

    const lines = msg.text.split("\n");
    const tagsLine = lines.find((l) => l.startsWith("Tag Suggestions"));
    const labelingTags = tagsLine
        ?.split(":")[1]
        .split("/")
        .map((t) => t.trim());

    const publishedTime = lines
        .find((l) => l.startsWith("Published Time"))
        ?.split(":")[1]
        .trim();

    const content = lines
        .find((l) => l.startsWith("Note"))
        ?.slice(5)
        .trim();

    let curatorUsername = m.text.split("(")[0];

    let curatorId = "";
    if (mention) {
        curatorId = m.text.substring(
            mention.offset,
            mention.offset + mention.length
        );
    }

    if (curatorId.length === 0) {
        curatorUsername = m.text.split(confirmString)[0].trim();
        curatorId = curatorUsername;
    }

    return {
        labelingTags,
        authorName: m.from.first_name, //TODO
        authorId: m.from.username || m.from.first_name, //TODO
        authorAvatar: "",
        banner: "",
        guildName: m.chat.title,
        channelName: "", //TODO
        title: "",
        publishedTime,
        content,
        attachments: [], //TODO
        curatorId,
        curatorUsername,
        curatorAvatar: "",
        curatorBanner: "",
    };
}
