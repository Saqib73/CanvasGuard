export const commissionKeys = {
  all: ["commissions"],
  artists: (filters = {}) => ["commissions", "artists", filters],
  requests: ["commissions", "requests"],
};
