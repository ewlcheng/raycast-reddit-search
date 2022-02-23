import { ActionPanel, Action, Icon, List, showToast, Toast } from "@raycast/api";
import fetch, { AbortError } from "node-fetch";
import { useRef, useState } from "react";
import RedditResultItem from "./RedditResultItem";
import PostActionPanel from "./PostActionPanel";
import { createSearchUrl, joinWithBaseUrl } from "./UrlBuilder";
import Sort from "./Sort";
import redditSort from "./RedditSort";

export default function FilterBySubredditPostList({
  subreddit,
  subredditName,
}: {
  subreddit: string;
  subredditName: string;
}) {
  const [results, setResults] = useState<RedditResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchRedditUrl, setSearchRedditUrl] = useState("");
  const [sort, setSort] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryRef = useRef<string>("");

  const doSearch = async (query: string, sort?: Sort) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setSearching(true);
    setResults([]);
    setSort(sort?.name ?? "");
    queryRef.current = query;

    if (!query) {
      setSearching(false);
      return;
    }

    setSearchRedditUrl(createSearchUrl(subreddit, false, query, "", 0, sort?.sortValue));

    try {
      const response = await fetch(createSearchUrl(subreddit, true, query, "", 10, sort?.sortValue), {
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
                permalink: string;
                selftext?: string;
                created_utc: number;
                thumbnail: string;
                subreddit: string;
                url_overridden_by_dest?: string;
                is_video: boolean;
              };
            }
          ];
        };
      };

      const reddits =
        json.data && json.data.children
          ? json.data.children.map(
              (x) =>
                ({
                  id: x.data.id,
                  title: x.data.title,
                  url: joinWithBaseUrl(x.data.permalink),
                  description: x.data.selftext,
                  imageUrl:
                    x.data.is_video ||
                    (x.data.url_overridden_by_dest &&
                      !x.data.url_overridden_by_dest.endsWith(".jpg") &&
                      !x.data.url_overridden_by_dest.endsWith(".gif") &&
                      !x.data.url_overridden_by_dest.endsWith(".png"))
                      ? ""
                      : x.data.url_overridden_by_dest,
                  created: new Date(x.data.created_utc * 1000).toLocaleString(),
                  thumbnail: x.data.thumbnail,
                  subreddit: x.data.subreddit,
                } as RedditResultItem)
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

  return (
    <List
      isLoading={searching}
      onSearchTextChange={doSearch}
      throttle
      searchBarPlaceholder={`Search r/${subredditName}...`}
    >
      {results.length > 0 && (
        <>
          <List.Section title={sort ? `Results (sorted by ${sort})` : "Results"}>
            {results.map((x) => (
              <List.Item
                key={x.id}
                icon={
                  x.thumbnail && (x.thumbnail.startsWith("http:") || x.thumbnail.startsWith("https:"))
                    ? { source: x.thumbnail }
                    : Icon.Text
                }
                title={x.title}
                accessoryTitle={`Posted ${x.created} r/${x.subreddit}`}
                actions={<PostActionPanel data={x} />}
              />
            ))}
          </List.Section>
          <List.Section title="Didn't find what you're looking for?">
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
            <List.Item
              key="sortByRelevance"
              icon={Icon.MagnifyingGlass}
              title="Sort by relevance"
              actions={
                <ActionPanel>
                  <Action title="Sort by relevance" onAction={() => doSearch(queryRef.current, redditSort.relevance)} />
                </ActionPanel>
              }
            />
            <List.Item
              key="sortByHot"
              icon={Icon.MagnifyingGlass}
              title="Sort by hotest"
              actions={
                <ActionPanel>
                  <Action title="Sort by hotest" onAction={() => doSearch(queryRef.current, redditSort.hot)} />
                </ActionPanel>
              }
            />
            <List.Item
              key="sortByTop"
              icon={Icon.MagnifyingGlass}
              title="Sort by top"
              actions={
                <ActionPanel>
                  <Action title="Sort by top" onAction={() => doSearch(queryRef.current, redditSort.top)} />
                </ActionPanel>
              }
            />
            <List.Item
              key="sortByLatest"
              icon={Icon.MagnifyingGlass}
              title="Sort by latest"
              actions={
                <ActionPanel>
                  <Action title="Sort by latest" onAction={() => doSearch(queryRef.current, redditSort.latest)} />
                </ActionPanel>
              }
            />
            <List.Item
              key="sortByComments"
              icon={Icon.MagnifyingGlass}
              title="Sort by comments"
              actions={
                <ActionPanel>
                  <Action title="Sort by comments" onAction={() => doSearch(queryRef.current, redditSort.comments)} />
                </ActionPanel>
              }
            />
          </List.Section>
        </>
      )}
    </List>
  );
}
