import { Message } from "grammy/types";
import { expect, test } from "vitest";
import { extractTags, mentionsBot, parseConfirmMessage } from "../src/telegram";

const mockMessage = {
    message_id: 277,
    text: "@CoriTgBot",
    entities: [{ offset: 0, length: 10, type: "mention" }],
} as Message;

const mockMessage2 = {
    text: "@CoriTgBot @adazhang Vibe is hot.",
    entities: [
        { offset: 0, length: 10, type: "mention" },
        { offset: 11, length: 9, type: "mention" },
    ],
} as Message;

test("mentions work well", () => {
    expect(mentionsBot(mockMessage, "@CoriTgBot")).toBeTruthy();
    expect(mentionsBot(mockMessage2, "@CoriTgBot")).toBeTruthy();
});

test("extract tags", () => {
    const m = {
        text: "@CoriTgBot test,test1",
        entities: [{ offset: 0, length: 10, type: "mention" }],
    };
    expect(extractTags(m as any).join("/")).toBe("test/test1");
});

const confirmMsg = {
    message_id: 824,
    from: {
        id: 427702820,
        is_bot: false,
        first_name: "Adazz",
        username: "adazhang",
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
            "Atlas(@WaterTofu) thinks what you said is great, and wants to feed it to me. Reply 'OK' to confirm \n" +
            "Note: Ok\n" +
            "Published Time: Sat, 15 Apr 2023 20:33:28 GMT\n" +
            "Tag Suggestions: again",
        entities: [[Object]],
        is_topic_message: true,
    },
    text: "ok",
    is_topic_message: true,
};

test("parse confirm msg ", () => {
    const res = parseConfirmMessage(confirmMsg as any);
    console.log(res);
});
