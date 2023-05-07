import { assert, test } from "vitest";
import { isUsefulReply } from "../src";
const botId = "@HealeriverBot";
const replyMsg = {
    message_id: 58,
    from: {
        id: 6082185442,
        is_bot: false,
        first_name: "Salta",
        last_name: "Dev",
        username: "saltadev",
        language_code: "en",
    },
    chat: {
        id: -1001918703227,
        title: "Salta & DevBot",
        is_forum: true,
        type: "supergroup",
    },
    date: 1683477138,
    message_thread_id: 8,
    reply_to_message: {
        message_id: 46,
        from: {
            id: 6082185442,
            is_bot: false,
            first_name: "Salta",
            last_name: "Dev",
            username: "saltadev",
            language_code: "en",
        },
        chat: {
            id: -1001918703227,
            title: "Salta & DevBot",
            is_forum: true,
            type: "supergroup",
        },
        date: 1683475374,
        message_thread_id: 8,
        text: "hiiiii will see you tomorrow #event " + botId,
        entities: [
            { offset: 29, length: 6, type: "hashtag" },
            { offset: 36, length: 14, type: "mention" },
        ],
        is_topic_message: true,
    },
    text: "will do",
    is_topic_message: true,
};

const confirmMsg = {
    message_id: 824,
    from: {
        id: 427702820,
        is_bot: false,
        first_name: "xxxxx",
        username: "xxxxxxxx",
    },
    chat: {
        id: -1001932320207,
        title: "zuzalu‘s agora",
        is_forum: true,
        type: "supergroup",
    },
    date: 1681591285,
    message_thread_id: 139,
    reply_to_message: {
        message_id: 823,
        from: {
            id: 5745158650,
            is_bot: true,
            first_name: "Cori",
            username: "CoriTgBot",
        },
        chat: {
            id: -1001932320207,
            title: "zuzalu‘s agora",
            is_forum: true,
            type: "supergroup",
        },
        date: 1681591268,
        message_thread_id: 139,
        text:
            "xxxxx(@xxxxxxxxx) thinks what you said is great, and wants to feed it to me. Reply 'OK' to confirm \n" +
            "Note: Ok\n" +
            "Published Time: Sat, 15 Apr 2023 20:33:28 GMT\n" +
            "Tag Suggestions: again",
        is_topic_message: true,
    },
    text: "ok",
    is_topic_message: true,
};

test("watch the reply message to an event", () => {
    const reply2 = isUsefulReply(replyMsg as any);
    assert(reply2 === "event", "it's a reply to an event");
});

test("watch the reply message to an confirm message", () => {
    const reply2 = isUsefulReply(confirmMsg as any);
    console.log(reply2);
    assert(reply2 === "confirmMsg", "it's a reply to a confirm message");
});
