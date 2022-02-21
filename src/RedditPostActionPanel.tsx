import { ActionPanel, Action, Icon, Detail } from "@raycast/api";

export default function RedditPostActionPanel({ data }) {
  if (data.description) {
    return (
      <ActionPanel>
        <Action.Push
          title="Show Details"
          target={
            <Detail
              navigationTitle={data.title}
              markdown={data.description ? data.description : "No description"}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser url={data.url} />
                </ActionPanel>
              }
            />
          }
        />
        <Action.OpenInBrowser url={data.url} icon={Icon.Text} />
      </ActionPanel>
    );
  } else if (data.imageUrl) {
    return (
      <ActionPanel>
        <Action.Push
          title="Show Details"
          target={
            <Detail
              navigationTitle={data.title}
              markdown={`![${data.title}](${data.imageUrl} "${data.title}}")`}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser url={data.url} />
                </ActionPanel>
              }
            />
          }
        />
        <Action.OpenInBrowser url={data.url} icon={Icon.Text} />
      </ActionPanel>
    );
  } else {
    return (
      <ActionPanel>
        <Action.OpenInBrowser url={data.url} icon={Icon.Text} />
      </ActionPanel>
    );
  }
}
