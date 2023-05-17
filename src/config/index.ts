export const config = {
    gpt: true,
    crossbell: true,
};

export const makeUrl = (characterId: number, noteId: number) => {
    return `https://zuzu-log.vercel.app/event/${characterId}/${noteId}`;
};
