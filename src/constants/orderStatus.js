const ORDER_STATUS = {
  PLANNED: "planifié",
  IN_PROGRESS: "en cours",
  DONE: "terminé",
  CANCELLED: "annulé",
};

const ORDER_STATUSES = Object.values(ORDER_STATUS);

module.exports = { ORDER_STATUS, ORDER_STATUSES };
