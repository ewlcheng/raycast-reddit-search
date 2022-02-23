import { ActionPanel, Action, Icon, List, showToast, Toast } from "@raycast/api";
import { AbortError } from "node-fetch";
import { useEffect, useRef, useState } from "react";
import RedditResultItem from "./RedditResultItem";
import PostActionPanel from "./PostActionPanel";
import SubredditList from "./SubredditList";
import { joinWithBaseUrl, createSearchUrl } from "./UrlBuilder";
import FilterBySubredditPostList from "./FilterBySubredditPostList";
import Sort from "./Sort";
import redditSort from "./RedditSort";
import { searchAll } from "./Api";

export default function PostList({
  favorites,
  addFavoriteSubreddit,
  removeFavoriteSubreddit,
}: {
  favorites: string[];
  addFavoriteSubreddit: (subreddit: string) => void;
  removeFavoriteSubreddit: (subreddit: string) => void;
}) {
  const [results, setResults] = useState<RedditResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchRedditUrl, setSearchRedditUrl] = useState("");
  const [showSearchTypes, setShowSearchTypes] = useState(true);
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
      setShowSearchTypes(true);
      return;
    }

    setShowSearchTypes(false);
    setSearchRedditUrl(createSearchUrl("", false, query, "", 0, sort?.sortValue));

    try {
      const apiResults = await searchAll("", query, sort?.sortValue ?? "", abortControllerRef.current);
      setResults(apiResults);
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
    <List isLoading={searching} onSearchTextChange={doSearch} throttle searchBarPlaceholder="Search Reddit...">
      {showSearchTypes && (
        <>
          <List.Section title="More ways to search">
            <List.Item
              key="searchOnRedditForSubreddits"
              icon={Icon.MagnifyingGlass}
              title="Search subreddits..."
              actions={
                <ActionPanel>
                  <Action.Push
                    title="Search subreddits"
                    target={
                      <SubredditList
                        favorites={favorites}
                        addFavoriteSubreddit={addFavoriteSubreddit}
                        removeFavoriteSubreddit={removeFavoriteSubreddit}
                      />
                    }
                  />
                </ActionPanel>
              }
            />
          </List.Section>
          <List.Section title="Favorite subreddits">
            {favorites.map((x) => (
              <List.Item
                key={x}
                title={x}
                actions={
                  <ActionPanel>
                    <Action.Push
                      title="Search subreddit"
                      target={<FilterBySubredditPostList subreddit={x} subredditName={x.substring(3, x.length - 1)} />}
                    />
                    <Action.OpenInBrowser url={joinWithBaseUrl(x)} icon={Icon.Globe} />
                    <Action
                      title="Remove from Favorites"
                      icon={Icon.Trash}
                      onAction={async () => {
                        await removeFavoriteSubreddit(x);
                      }}
                    />
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
        </>
      )}
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
