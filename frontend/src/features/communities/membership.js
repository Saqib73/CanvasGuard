// members / createdBy come back either as ids or as populated users
const idOf = (value) => (typeof value === "string" ? value : value?._id);

export const isMemberOf = (community, userId) =>
  Boolean(userId) && (community.members || []).some((m) => idOf(m) === userId);

export const isCreatorOf = (community, userId) =>
  Boolean(userId) && idOf(community.createdBy) === userId;
