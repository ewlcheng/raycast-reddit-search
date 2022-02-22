import { ActionPanel, Action, Icon, List, showToast, Toast } from "@raycast/api";
import fetch, { AbortError } from "node-fetch";
import { useRef, useState } from "react";
import { URLSearchParams } from "url";
import RedditPost from "./RedditPost";
import FilterBySubredditPostList from "./FilterBySubredditPostList";

const redditUrl = "https://www.reddit.com/";
const searchUrl = "https://www.reddit.com/search";
const apiUrl = "https://www.reddit.com/search.json";

export default function SubredditPostList() {
  const [results, setResults] = useState<RedditPost[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchRedditUrl, setSearchRedditUrl] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const doSearch = async (query: string) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setSearching(true);
    setResults([]);

    if (!query) {
      setSearching(false);
      return;
    }

    const params = new URLSearchParams();
    params.append("q", query);
    params.append("type", "sr");

    setSearchRedditUrl(searchUrl + "?" + params.toString());

    params.append("limit", "10");

    try {
      const response = await fetch(apiUrl + "?" + params.toString(), {
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

      const reddits = json.data.children.map(
        (x) =>
          ({
            id: x.data.id,
            title: x.data.title,
            url: redditUrl + x.data.url.substring(1),
            created: new Date(x.data.created_utc * 1000).toLocaleString(),
            subreddit: x.data.display_name_prefixed.substring(2),
          } as RedditPost)
      );

      setResults(reddits);
    } catch (error) {
      if (error instanceof AbortError) {
        return;
      }

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
    <List isLoading={searching} onSearchTextChange={doSearch} throttle searchBarPlaceholder="Search Subreddits...">
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
          actions={
            <ActionPanel>
              <Action.Push
                title="Search Reddit..."
                target={<FilterBySubredditPostList subredditName={x.subreddit} subreddit={x.url} />}
              />
              <Action.OpenInBrowser url={x.url} icon={Icon.Globe} />
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
