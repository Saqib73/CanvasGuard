import { authKeys } from "../features/auth/api/auth.keys";
import { postKeys } from "../features/posts/api/posts.keys";
import { profileKeys } from "../features/profiles/api/profiles.keys";
import { communityKeys } from "../features/communities/api/communities.keys";
import { commissionKeys } from "../features/commissions/api/commissions.keys";
import { notificationKeys } from "../features/notifications/api/notifications.keys";

export {
  authKeys,
  postKeys,
  profileKeys,
  communityKeys,
  commissionKeys,
  notificationKeys,
};

export const queryKeys = {
  auth: authKeys,
  posts: postKeys,
  profiles: profileKeys,
  communities: communityKeys,
  commissions: commissionKeys,
  notifications: notificationKeys,
};

export default queryKeys;
