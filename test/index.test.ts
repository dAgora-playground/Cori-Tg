import { Message } from "grammy/types";
import { expect, test } from "vitest";
import {
    extractLabels,
    mentionsBot,
    parseConfirmMessage,
} from "../src/telegram";

const mockMessage = {
    message_id: 277,
    text: "@CoriTgBot",
    entities: [{ offset: 0, length: 10, type: "mention" }],
} as Message;

const mockMessage2 = {
    text: "@CoriTgBot @xxxxxxx Vibe is hot.",
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
        text: "@xxxxxxxxDevBot title is xxx @xxx #event #yes",
        entities: [
            { offset: 0, length: 15, type: "mention" },
            { offset: 34, length: 6, type: "hashtag" },
            { offset: 41, length: 4, type: "hashtag" },
        ],
    };
    const label = extractLabels(m as any, "@xxxxxxxxDevBot");

    expect(label.labelingTags.join("/")).toBe("event/yes");
    expect(label.textWithoutTags).toBe("title is xxx @xxx");

    const m2 = {
        text: "test test @HealeriverBot #event",
        entities: [
            { offset: 10, length: 14, type: "mention" },
            { offset: 25, length: 6, type: "hashtag" },
        ],
    };
    const label2 = extractLabels(m2 as any, "@HealeriverBot");

    expect(label2.labelingTags.join("/")).toBe("event");
    expect(label2.textWithoutTags).toBe("test test");
});

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

test("parse confirm msg ", () => {
    const res = parseConfirmMessage(confirmMsg as any);
    console.log(res);
});
