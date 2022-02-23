import { ActionPanel, Action, Icon, List, showToast, Toast } from "@raycast/api";
import fetch, { AbortError } from "node-fetch";
import { useEffect, useRef, useState } from "react";
import RedditResultSubreddit from "./RedditResultSubreddit";
import FilterBySubredditPostList from "./FilterBySubredditPostList";
import { joinWithBaseUrl, createSearchUrl } from "./UrlBuilder";
import { addSubreddit, getFavoriteSubreddits, removeSubreddit } from "./FavoriteSubreddits";

export default function SubredditPostList() {
  const [results, setResults] = useState<RedditResultSubreddit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchRedditUrl, setSearchRedditUrl] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryRef = useRef<string>("");

  const doSearch = async (query: string) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setSearching(true);
    setResults([]);
    queryRef.current = query;

    if (!query) {
      setSearching(false);
      return;
    }

    setSearchRedditUrl(createSearchUrl("", "", false, query, "sr", 0));

    try {
      const response = await fetch(createSearchUrl("", "", true, query, "sr", 10), {
        method: "get",
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const json = (await response.json()) as {
        data: {
          children: [
            {
              data: {
                id: string;
                title: string;
                url: string;
                created_utc: number;
                display_name_prefixed: string;
              };
            }
          ];
        };
      };

      const favorites = await getFavoriteSubreddits();

      const reddits =
        json.data && json.data.children
          ? json.data.children.map(
              (x) =>
                ({
                  id: x.data.id,
                  title: x.data.title,
                  url: joinWithBaseUrl(x.data.url),
                  subreddit: x.data.url,
                  created: new Date(x.data.created_utc * 1000).toLocaleString(),
                  subredditName: x.data.display_name_prefixed.substring(2),
                  isFavorite: favorites.some((y) => y === x.data.url),
                } as RedditResultSubreddit)
            )
          : [];

      setResults(reddits);
    } catch (error) {
      if (error instanceof AbortError) {
        return;
      }

      console.log(error);
      showToast({
        style: Toast.Style.Failure,
        title: "Something went wrong :(",
        message: String(error),
      });
    } finally {
      setSearching(false);
    }
  };

  // useEffect(() => {
  //   const getFavorites = async () => {
  //     const favorites = await getFavoriteSubreddits();
  //     setFavorites(favorites);
  //   };

  //   getFavorites();
  // }, []);

  return (
    <List isLoading={searching} onSearchTextChange={doSearch} throttle searchBarPlaceholder="Search Subreddits...">
      {results.map((x) => (
        <List.Item
          key={x.id}
          icon={Icon.Text}
          title={x.title}
          accessoryTitle={`Posted ${x.created} r/${x.subredditName}`}
          actions={
            <ActionPanel>
              <Action.Push
                title="Search Reddit..."
                target={<FilterBySubredditPostList subredditName={x.subredditName} subreddit={x.subreddit} />}
              />
              <Action.OpenInBrowser url={x.url} icon={Icon.Globe} />
              {!x.isFavorite && (
                <Action
                  title="Favorite"
                  icon={Icon.Star}
                  onAction={async () => {
                    await addSubreddit(x.subreddit);
                    // const favorites = await getFavoriteSubreddits();
                    // setFavorites(favorites);
                    const index = results.findIndex((y) => y.id === x.id);
                    setResults([
                      ...results.slice(0, index),
                      { ...results[index], isFavorite: !results[index].isFavorite },
                      ...results.slice(index + 1),
                    ]);
                    // await doSearch(queryRef.current);
                  }}
                />
              )}
              {x.isFavorite && (
                <Action
                  title="Remove from Favorites"
                  icon={Icon.Trash}
                  onAction={async () => {
                    await removeSubreddit(x.subreddit);
                    // const favorites = await getFavoriteSubreddits();
                    // setFavorites(favorites);
                    const index = results.findIndex((y) => y.id === x.id);
                    setResults([
                      ...results.slice(0, index),
                      { ...results[index], isFavorite: !results[index].isFavorite },
                      ...results.slice(index + 1),
                    ]);
                    // await doSearch(queryRef.current);
                  }}
                />
              )}
            </ActionPanel>
          }
        />
      ))}
      {results.length > 0 && (
        <List.Item
          key="searchOnReddit"
          icon={Icon.MagnifyingGlass}
          title="Show all results on Reddit..."
          actions={
            <ActionPanel>
              <Action.OpenInBrowser url={searchRedditUrl} icon={Icon.Globe} />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}
