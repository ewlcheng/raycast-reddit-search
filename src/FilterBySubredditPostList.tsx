import { List, showToast, Toast } from "@raycast/api";
import { AbortError } from "node-fetch";
import { useRef, useState } from "react";
import RedditResultItem from "./RedditApi/RedditResultItem";
import Sort from "./Sort";
import RedditSort from "./RedditSort";
import { searchAll } from "./RedditApi/Api";
import PostList from "./PostList";
import Preferences from "./Preferences";
import getPreferences from "./Preferences";

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
  const [sort, setSort] = useState(RedditSort.relevance);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryRef = useRef<string>("");

  const doSearch = async (query: string, sort = RedditSort.relevance) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setSearching(true);
    setResults([]);
    setSort(sort);
    queryRef.current = query;

    if (!query) {
      setSearching(false);
      return;
    }

    try {
      const preferences = getPreferences();
      const apiResults = await searchAll(
        subreddit,
        query,
        preferences.resultLimit,
        sort?.sortValue ?? "",
        abortControllerRef.current
      );
      setSearchRedditUrl(apiResults.url);
      setResults(apiResults.items);
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
      <PostList
        posts={results}
        sort={sort}
        searchRedditUrl={searchRedditUrl}
        doSearch={(sort: Sort) => doSearch(queryRef.current, sort)}
      />
    </List>
  );
}
