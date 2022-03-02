import { ActionPanel, Action, Icon, List } from "@raycast/api";
import RedditResultItem from "./RedditApi/RedditResultItem";
import PostActionPanel from "./PostActionPanel";
import Sort from "./Sort";
import redditSort from "./RedditSort";
import SortListItem from "./SortListItem";

export default function PostList({
  posts,
  sort,
  searchRedditUrl,
  doSearch,
}: {
  posts: RedditResultItem[];
  sort: Sort;
  searchRedditUrl: string;
  doSearch: (sort: Sort) => void;
}) {
  if (!posts.length) {
    return null;
  }

  return (
    <>
      <List.Section title={sort ? `Results (Sorted by ${sort.name})` : "Results"}>
        {posts.map((x) => (
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
        <SortListItem sort={redditSort.relevance} currentSort={sort} doSearch={doSearch} />
        <SortListItem sort={redditSort.hot} currentSort={sort} doSearch={doSearch} />
        <SortListItem sort={redditSort.top} currentSort={sort} doSearch={doSearch} />
        <SortListItem sort={redditSort.latest} currentSort={sort} doSearch={doSearch} />
        <SortListItem sort={redditSort.comments} currentSort={sort} doSearch={doSearch} />
      </List.Section>
    </>
  );
}
