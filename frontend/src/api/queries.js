import { communityKeys } from "../features/communities/api/communities.keys";
import { commissionKeys } from "../features/commissions/api/commissions.keys";
import { notificationKeys } from "../features/notifications/api/notifications.keys";

export {
  useCommunities,
  useMyCommunities,
  useCommunityFeed,
  useJoinCommunity,
  useLeaveCommunity,
  useCreateCommunity,
} from "../features/communities/api/communities.hooks";

export {
  useCommissionArtists,
  useCommissionRequests,
  useRespondToCommission,
  useCreateCommissionRequest,
} from "../features/commissions/api/commissions.hooks";

export {
  useNotifications,
} from "../features/notifications/api/notifications.hooks";

export const queryKeys = {
  notifications: notificationKeys.all,
  communities: communityKeys.all,
  myCommunities: communityKeys.mine,
  communityFeed: communityKeys.feed,
  commissionArtists: commissionKeys.artists,
  commissionRequests: commissionKeys.requests,
};
