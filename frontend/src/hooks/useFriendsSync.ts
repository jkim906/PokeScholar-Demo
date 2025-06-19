import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useFriendsStore } from "../stores/friendsStore";

/**
 * useFriendsSync is a custom hook that synchronizes the user's friends list
 * with the backend. It automatically fetches the friends list when the user is signed in
 * and updates the Zustand store with the latest data.
 *
 * This hook should be used in components that need to display or manage the user's friends.
 * It handles loading states and error handling automatically.
 */
export const useFriendsSync = () => {
  const { user } = useUser();
  const {
    friends,
    pendingRequests,
    isLoading,
    error,
    loadFriends,
    loadFriendsRequest,
    removeFriend,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    setFriends,
    setPendingRequests,
    setError,
  } = useFriendsStore();

  useEffect(() => {
    if (user?.id) {
      loadFriends(user.id);
      loadFriendsRequest(user.id);
    } else {
      // Clear the state when user signs out
      setFriends([]);
      setPendingRequests([]);
      setError(null);
      }
  }, [user?.id, loadFriends, loadFriendsRequest, setFriends, setPendingRequests, setError]);

  return {
    friends,
    pendingRequests,
    isLoading,
    error,
    loadFriends,
    loadFriendsRequest,
    removeFriend,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
  };
};
