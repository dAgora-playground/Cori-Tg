// keyValueStore.test.ts
import { test, beforeEach, afterEach, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { addKeyValue, loadKeyValuePairs } from "../src/utils/keyValueStore";

const rootPath = path.resolve("./");
const fileName = "store/keyValueStore.json";
const filePath = path.join(rootPath, fileName);

function deleteFile(path: string): void {
    if (fs.existsSync(path)) {
        fs.unlinkSync(path);
    }
}

beforeEach(() => {
    deleteFile(filePath);
});

afterEach(() => {
    deleteFile(filePath);
});

test("add and load key-value pairs multiple times", () => {
    const key = "testKey";
    const value = "testValue";
    const count = 5;

    for (let i = 0; i < count; i++) {
        const result = addKeyValue(key + i, value + i);
        expect(result).toBe(true);
    }

    const targetMap = new Map<string, string>();
    loadKeyValuePairs(targetMap);

    for (let i = 0; i < count; i++) {
        expect(targetMap.has(key + i)).toBe(true);
        expect(targetMap.get(key + i)).toBe(value + i);
    }
});
