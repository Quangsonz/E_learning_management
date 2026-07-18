const assignmentService = require('../services/assignment.service');
const catchAsync = require('../utils/catchAsync');

class AssignmentController {
  createAssignment = catchAsync(async (req, res, next) => {
    const assignment = await assignmentService.createAssignment(
      req.params.courseId, 
      req.body, 
      req.user
    );

    res.status(201).json({
      status: 'success',
      data: { assignment }
    });
  });

  getAssignments = catchAsync(async (req, res, next) => {
    const assignments = await assignmentService.getAssignmentsByCourse(
      req.params.courseId, 
      req.user
    );

    res.status(200).json({
      status: 'success',
      results: assignments.length,
      data: { assignments }
    });
  });

  getAssignmentById = catchAsync(async (req, res, next) => {
    const assignment = await assignmentService.getAssignmentById(
      req.params.id, 
      req.user
    );

    res.status(200).json({
      status: 'success',
      data: { assignment }
    });
  });

  submitAssignment = catchAsync(async (req, res, next) => {
    const submission = await assignmentService.submitAssignment(
      req.params.assignmentId, 
      req.body, 
      req.user
    );

    res.status(200).json({
      status: 'success',
      message: 'Nộp bài tập thành công!',
      data: { submission }
    });
  });

  getSubmissions = catchAsync(async (req, res, next) => {
    const submissions = await assignmentService.getSubmissionsByAssignment(
      req.params.assignmentId, 
      req.user
    );

    res.status(200).json({
      status: 'success',
      results: submissions.length,
      data: { submissions }
    });
  });

  gradeSubmission = catchAsync(async (req, res, next) => {
    const submission = await assignmentService.gradeSubmission(
      req.params.submissionId, 
      req.body, 
      req.user
    );

    res.status(200).json({
      status: 'success',
      message: 'Chấm điểm và phản hồi bài tập thành công!',
      data: { submission }
    });
  });

  getMySubmission = catchAsync(async (req, res, next) => {
    const submission = await assignmentService.getStudentSubmission(
      req.params.assignmentId,
      req.user
    );

    res.status(200).json({
      status: 'success',
      data: { submission }
    });
  });
}

module.exports = new AssignmentController();
