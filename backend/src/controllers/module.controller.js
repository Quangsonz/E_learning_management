const moduleService = require('../services/module.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

class ModuleController {
  getModules = catchAsync(async (req, res, next) => {
    const modules = await moduleService.getModulesByCourse(req.params.courseId, req.user);

    res.status(200).json({
      status: 'success',
      results: modules.length,
      data: {
        modules,
      },
    });
  });

  getModule = catchAsync(async (req, res, next) => {
    const mod = await moduleService.getModuleById(req.params.id, req.params.courseId, req.user);

    res.status(200).json({
      status: 'success',
      data: {
        module: mod,
      },
    });
  });

  createModule = catchAsync(async (req, res, next) => {
    const newModule = await moduleService.createModule(req.params.courseId, req.body, req.user);

    res.status(201).json({
      status: 'success',
      data: {
        module: newModule,
      },
    });
  });

  updateModule = catchAsync(async (req, res, next) => {
    const updatedModule = await moduleService.updateModule(req.params.id, req.params.courseId, req.body, req.user);

    res.status(200).json({
      status: 'success',
      data: {
        module: updatedModule,
      },
    });
  });

  deleteModule = catchAsync(async (req, res, next) => {
    const isCascade = req.query.cascade === 'true' || req.query.cascade === true;
    await moduleService.deleteModule(req.params.id, req.params.courseId, isCascade, req.user);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

  reorderModules = catchAsync(async (req, res, next) => {
    const { modules } = req.body;
    if (!modules || !Array.isArray(modules)) {
      return next(new AppError('Dữ liệu danh sách chương học không hợp lệ', 400));
    }

    const result = await moduleService.reorderModules(req.params.courseId, modules, req.user);

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  });
}

module.exports = new ModuleController();
