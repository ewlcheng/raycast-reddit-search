import fetch from "node-fetch";
import RedditResultItem from "./RedditResultItem";
import RedditResultSubreddit from "./RedditResultSubreddit";
import { createSearchUrl, joinWithBaseUrl } from "./UrlBuilder";

export const searchAll = async (subreddit: string, query: string, sort: string, abort?: AbortController) => {
  const response = await fetch(createSearchUrl(subreddit, true, query, "", 10, sort), {
    method: "get",
    signal: abort?.signal,
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

  return json.data && json.data.children
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
};

export const searchSubreddits = async (query: string, abort?: AbortController) => {
  const response = await fetch(createSearchUrl("", true, query, "sr", 10), {
    method: "get",
    signal: abort?.signal,
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

  return json.data && json.data.children
    ? json.data.children.map(
        (x) =>
          ({
            id: x.data.id,
            title: x.data.title,
            url: joinWithBaseUrl(x.data.url),
            subreddit: x.data.url,
            created: new Date(x.data.created_utc * 1000).toLocaleString(),
            subredditName: x.data.display_name_prefixed.substring(2),
          } as RedditResultSubreddit)
      )
    : [];
};