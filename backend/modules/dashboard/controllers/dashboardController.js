const dashboardService = require("modules/dashboard/services/dashboardService");
const responseUtils = require("utils/responseUtils");

const dashboardController = {
  getDashboardData: async (req, res) => {
    try {
      const data = await dashboardService.getSummaryData();
      return responseUtils.ok(res, data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      return responseUtils.error(res, "Could not fetch dashboard data.");
    }
  },
};

module.exports = dashboardController;
