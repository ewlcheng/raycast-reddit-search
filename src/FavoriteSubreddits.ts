import { LocalStorage } from "@raycast/api";

const key = "favoriteSubreddits";

export const subredditExists = async (subreddit: string) => {
    const item = await LocalStorage.getItem<string>(key);
    if (!item) {
        return false;
    }

    const favorites:string[] = JSON.parse(item.toString());
    return favorites.some(x => x === subreddit);
};

export const getFavoriteSubreddits = async () => {
    const item = await LocalStorage.getItem<string>(key);
    if (!item) {
        return [];
    }

    const favorites:string[] = JSON.parse(item.toString());
    return favorites;
};

export const addSubreddit = async (subreddit: string) => {
    const item = await LocalStorage.getItem<string>(key);

    const favorites:string[] = !item ? [] : JSON.parse(item.toString());
    if (favorites.some(x => x === subreddit)) {
        return;
    }

    favorites.push(subreddit);
    await LocalStorage.setItem(key, JSON.stringify(favorites));
};

export const removeSubreddit = async (subreddit: string) => {
    const item = await LocalStorage.getItem<string>(key);

    const favorites:string[] = !item ? [] : JSON.parse(item.toString());
    if (!favorites.some(x => x === subreddit)) {
        return;
    }

    const index = favorites.indexOf(subreddit);
    const newFavorites = [...favorites.slice(0, index), ...favorites.slice(index + 1)];
    await LocalStorage.setItem(key, JSON.stringify(newFavorites));
};