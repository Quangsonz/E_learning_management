const searchService = require('../services/search.service');
const catchAsync = require('../utils/catchAsync');

class SearchController {
  globalSearch = catchAsync(async (req, res, next) => {
    const { q, type, limit } = req.query;
    const user = req.user || null;

    const data = await searchService.globalSearch({ q, type, limit }, user);

    res.status(200).json({
      status: 'success',
      data
    });
  });
}

module.exports = new SearchController();
