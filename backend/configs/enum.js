const roleenum = Object.freeze({
  USER: 1,
  ADMIN: 2,
  // Add more roles as needed
});
const statusenum = Object.freeze({
    AUTHENTICATED: 1,
    NON_AUTHENTICATED: 2
});
// Optional: reverse mapping (id to name)
const RoleNameById = Object.freeze({
  1: 'USER',
  2: 'ADMIN',
  3: 'MODERATOR',
  4: 'GUEST',
});

module.exports = {
  roleenum,
  statusenum,
  RoleNameById,
};
