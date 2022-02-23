import useFavoriteSubreddits from "./FavoriteSubreddits";
import PostList from "./PostList";

export default function Command() {
  const [favorites, addSubreddit, removeSubreddit] = useFavoriteSubreddits();

  return (
    <PostList favorites={favorites} addFavoriteSubreddit={addSubreddit} removeFavoriteSubreddit={removeSubreddit} />
  );
}
