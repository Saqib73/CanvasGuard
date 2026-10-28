export const commissionKeys = {
  all: ["commissions"],
  artists: (filters = {}) => ["commissions", "artists", filters],
  artist: (id) => ["commissions", "artist", id],
  // Prefix for both lists, so invalidating it refreshes received and sent
  requests: ["commissions", "requests"],
  requestList: (role) => ["commissions", "requests", role],
};
