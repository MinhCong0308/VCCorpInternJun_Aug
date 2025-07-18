const roleenum = Object.freeze({
  USER: 1,
  ADMIN: 2,
  // Add more roles as needed
});
const statusenum = Object.freeze({
    AUTHENTICATED: 1,
    NON_AUTHENTICATED: 2
});
const statuspostenum = Object.freeze({
    PENDING: 1,
    APPROVED: 2,
    REJECTED: 3,
});
const statuscode = Object.freeze({
  OK: 200,
  UNAUTHORIZED: 401,
  SERVER_ERROR: 500,
  BAD_REQUEST: 400,
  INVALIDATION_INPUT: 422
});
// Optional: reverse mapping (id to name)
const RoleNameById = Object.freeze({
  1: 'USER',
  2: 'ADMIN',
});

module.exports = {
  roleenum,
  statusenum,
  RoleNameById,
  statuspostenum,
  statuscode
};
