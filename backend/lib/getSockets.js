import { userSocketIds } from "../server.js";

const getSockets = (users = []) => {
  const sockets = users.map((user) => userSocketIds.get(user.toString()));

  return sockets;
};

export { getSockets };
