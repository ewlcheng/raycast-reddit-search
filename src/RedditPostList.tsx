import { ActionPanel, Action, Icon, List, showToast, Toast } from "@raycast/api";
import fetch, { AbortError } from "node-fetch";
import { useRef, useState } from "react";
import { URLSearchParams } from "url";
import RedditPost from "./RedditPost";
import RedditPostActionPanel from "./RedditPostActionPanel";
import SubredditList from "./SubredditList";

const redditUrl = "https://www.reddit.com/";
const searchUrl = "https://www.reddit.com/search";
const apiUrl = "https://www.reddit.com/search.json";

export default function RedditPostList() {
  const [results, setResults] = useState<RedditPost[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchRedditUrl, setSearchRedditUrl] = useState("");
  const [showSearchTypes, setShowSearchTypes] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const doSearch = async (query: string) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setSearching(true);
    setResults([]);

    if (!query) {
      setSearching(false);
      setShowSearchTypes(true);
      return;
    }

    setShowSearchTypes(false);

    const params = new URLSearchParams();
    params.append("q", query);

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

      const reddits = json.data.children.map(
        (x) =>
          ({
            id: x.data.id,
            title: x.data.title,
            url: redditUrl + x.data.permalink,
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
    <List isLoading={searching} onSearchTextChange={doSearch} throttle searchBarPlaceholder="Search Reddit...">
      {showSearchTypes && (
        <List.Section title="More ways to search">
          <List.Item
            key="searchOnRedditForSubreddits"
            icon={Icon.MagnifyingGlass}
            title="Search subreddits..."
            actions={
              <ActionPanel>
                <Action.Push title="Search subreddits" target={<SubredditList />} />
              </ActionPanel>
            }
          />
        </List.Section>
      )}
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
          actions={<RedditPostActionPanel data={x} />}
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
