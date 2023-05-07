import { Message } from "grammy/types";
import { expect, test } from "vitest";
import { extractLabels, mentionsBot } from "../src/telegram";

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
