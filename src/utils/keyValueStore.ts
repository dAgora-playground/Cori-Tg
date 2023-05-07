// keyValueStore.ts
import * as fs from "fs";
import * as path from "path";

const rootPath = path.resolve("./");

const fileName = "store/keyValueStore.json";

export function addKeyValue(key: string, value: string) {
    const filePath = path.join(rootPath, fileName);
    return new Promise((resolve, reject) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                fs.writeFile(filePath, "{}", (err) => {
                    if (err) return reject(err);
                    else {
                        let store: Record<string, string> = {};
                        store[key] = value;
                        // TODO: https://stackoverflow.com/questions/16316330/how-to-write-file-if-parent-folder-doesnt-exist
                        // TODO: what if writeFile is interrupted......
                        fs.writeFile(
                            filePath,
                            JSON.stringify(store, null, 2),
                            function (err) {
                                if (err) {
                                    return reject(err);
                                }
                                resolve("Key value pair added successfully.");
                            }
                        );
                    }
                });
            } else {
                fs.readFile(filePath, "utf-8", function (err, data) {
                    if (err) {
                        return reject(err);
                    }

                    let store: Record<string, string> = {};

                    if (data) {
                        try {
                            store = JSON.parse(data);
                        } catch (err) {
                            return reject(err);
                        }
                    }

                    store[key] = value;

                    fs.writeFile(
                        filePath,
                        JSON.stringify(store, null, 2),
                        function (err) {
                            if (err) {
                                return reject(err);
                            }
                            resolve("Key value pair added successfully.");
                        }
                    );
                });
            }
        });
    });
}

export function loadKeyValuePairs(
    targetMap: Map<string, string>
): Promise<void> {
    const filePath = path.join(rootPath, fileName);
    console.log(filePath);

    return new Promise((resolve, reject) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                resolve();
            }
            fs.readFile(filePath, "utf-8", function (err, data) {
                if (err) {
                    return reject(err);
                }

                let store: Record<string, string> = {};

                if (data) {
                    try {
                        store = JSON.parse(data);
                    } catch (err) {
                        return reject(err);
                    }
                }

                for (const [key, value] of Object.entries(store)) {
                    targetMap.set(key, value);
                }
                resolve();
            });
            fs.close;
        });
    });
}
