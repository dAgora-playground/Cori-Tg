import {
    AttributesMetadata,
    Contract,
    NoteMetadata,
    Result,
} from "crossbell.js";
import { Wallet } from "ethers";
import { pinyin } from "pinyin";
import { ParsedResult } from "../telegram";
import { NoteId } from "..";

export type Attrs = Exclude<AttributesMetadata["attributes"], null | undefined>;

const formatHandle = (authorId: string, guildId: string) => {
    const formatedGuildName = pinyin(guildId, {
        style: "normal",
    })
        .map((arr) => arr[0])
        .join("");
    const tmpHandle = (authorId + "-" + formatedGuildName)
        .toLowerCase()
        .slice(0, 31);
    let handle = "";
    for (let i = 0; i < Math.min(31, tmpHandle.length); i++) {
        const c = tmpHandle[i];
        if (
            (c >= "a" && c <= "z") ||
            (c >= "0" && c <= "9") ||
            c == "_" ||
            c == "-"
        ) {
            handle += c;
            continue;
        } else {
            handle += "-";
        }
    }
    return handle;
};

const createNewCharacter = async (
    c: Contract,
    admin: string,
    handle: string,
    name: string,
    authorAvatar: string,
    authorId: string,
    banner: string
) => {
    const { data, transactionHash } = await c.createCharacter(admin, handle, {
        name,
        avatars: [authorAvatar],
        banners: [
            {
                address: banner,
                mime_type: "media/image", //TODO
            },
        ],
        connected_accounts: ["csb://account:" + authorId + "@discord"],
    });
    return data;
};

export const getPermission = async (
    c: Contract,
    characterId: number,
    admin: string
) => {
    const permissions = (
        await c.getOperatorPermissionsForCharacter(characterId, admin)
    ).data;
    return permissions;
};
const getCharacterByHandle = async (
    c: Contract,
    admin: string,
    handle: string,
    name: string,
    authorAvatar: string,
    authorId: string,
    banner: string,
    checkAdminAuthorized: boolean = true
) => {
    let characterId = (
        await c.contract.getCharacterByHandle(handle)
    ).characterId.toNumber();

    if (!characterId) {
        if ((await c.existsCharacterForHandle(handle)).data) {
            throw new Error("handle has existed");
        }

        characterId = await createNewCharacter(
            c,
            admin,
            handle,
            name,
            authorAvatar,
            authorId,
            banner
        );
        //TODO: follow
        if (process.env.ADMIN_CHARACTER)
            await c.linkCharacter(
                process.env.ADMIN_CHARACTER,
                characterId,
                "follow"
            );
    }
    if (checkAdminAuthorized) {
        const characterOwner = await c.contract.ownerOf(characterId);
        if (characterOwner !== admin) {
            const permissions = await getPermission(c, characterId, admin);
            if (!permissions.includes("POST_NOTE")) {
                throw new Error(
                    characterId + "(" + handle + ") not authorized"
                );
            }
        }
    }

    return characterId;
};

export const getAdminContract = async (priKey: string) => {
    const admin = await new Wallet(priKey).getAddress();
    const contract = new Contract(priKey);
    return { admin, contract };
};

export async function useCrossbell(
    result: ParsedResult,
    data?: {
        attributes?: Attrs;
        reply2?: NoteId;
    }
) {
    // If the author has not been created a character, create one first
    // Otherwise, post note directly
    const priKey = process.env.adminPrivateKey;
    if (!priKey) throw Error("Admin has not been set up.");
    const { admin, contract } = await getAdminContract(priKey);

    // getAttrs from result
    const {
        labelingTags,
        authorName,
        authorId,
        authorAvatar,
        banner,
        guildName,
        title,
        publishedTime,
        content,
        attachments,
        curatorId,
        curatorUsername,
        curatorAvatar,
        curatorBanner,
    } = result;

    const handle = formatHandle(authorId, guildName);

    //TODO: is valid handle?
    if (handle.length < 3) {
        throw new Error("handle length is wrong");
    }

    const attrs = data?.attributes || [];

    const characterId = await getCharacterByHandle(
        contract,
        admin,
        handle,
        authorName,
        authorAvatar,
        authorId,
        banner
    );
    let curatorCharacterId = characterId;
    if (curatorId) {
        const curatorHandle = formatHandle(curatorId, guildName);
        if (curatorHandle !== handle) {
            curatorCharacterId = await getCharacterByHandle(
                contract,
                admin,
                curatorHandle,
                curatorUsername || curatorHandle,
                curatorAvatar || "",
                curatorId,
                curatorBanner || "",
                false
            );

            attrs.push({
                trait_type: "curator",
                value:
                    "csb://account:character-" +
                    curatorCharacterId +
                    "@crossbell",
            });
        }
    }

    const note = {
        sources: [
            "cori",
            "Telegram: " + guildName,
            // "Topic: " + channelName, // TODO
        ],
        title,
        content,
        attachments,
        date_published: new Date(publishedTime).toISOString(),
        attributes: [...attrs],
    } as NoteMetadata;

    if (labelingTags) note.tags = labelingTags;
    console.debug("[DEBUG]", note);

    let res: Result<
        {
            noteId: number;
        },
        true
    >;

    if (data?.reply2) {
        res = await contract.postNoteForNote(
            characterId,
            note,
            data.reply2.characterId,
            data.reply2.noteId
        );
    } else {
        res = await contract.postNote(characterId, note);
    }
    const noteId = res.data.noteId;

    return { characterId, noteId };
}
