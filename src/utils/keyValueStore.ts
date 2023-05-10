// keyValueStore.ts
import * as fs from "fs";
import * as path from "path";

const rootPath = path.resolve("./");

const fileName = "store/keyValueStore.json";

export function addKeyValue(key: string, value: string): boolean {
    const filePath = path.join(rootPath, fileName);

    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, "{}");
        }

        const data = fs.readFileSync(filePath, "utf-8");
        let store: Record<string, string> = {};

        if (data) {
            store = JSON.parse(data);
        }

        store[key] = value;
        fs.writeFileSync(filePath, JSON.stringify(store, null, 2));

        return true;
    } catch (err) {
        throw err;
    }
}

export function loadKeyValuePairs(targetMap: Map<string, string>): void {
    const filePath = path.join(rootPath, fileName);
    console.log(filePath);

    try {
        if (!fs.existsSync(filePath)) {
            return;
        }

        const data = fs.readFileSync(filePath, "utf-8");
        let store: Record<string, string> = {};

        if (data) {
            store = JSON.parse(data);
        }

        for (const [key, value] of Object.entries(store)) {
            targetMap.set(key, value);
        }
    } catch (err) {
        throw err;
    }
}
