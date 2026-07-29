const assignmentRepository = require('../repositories/assignment.repository');
const submissionRepository = require('../repositories/submission.repository');
const courseRepository = require('../repositories/course.repository');
const enrollmentRepository = require('../repositories/enrollment.repository');
const AppError = require('../utils/appError');

class AssignmentService {
  async createAssignment(courseId, assignmentData, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học này', 404);
    }

    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền tạo bài tập cho khóa học này', 403);
    }

    assignmentData.course = courseId;
    return await assignmentRepository.create(assignmentData);
  }

  async getAssignmentsByCourse(courseId, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học này', 404);
    }

    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    let hasAccess = false;
    if (user.role === 'admin' || instructorId === user.id) {
      hasAccess = true;
    } else {
      const enrollment = await enrollmentRepository.findByStudentAndCourse(user.id, courseId);
      if (enrollment && enrollment.paymentStatus === 'completed') {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      throw new AppError('Bạn không có quyền xem bài tập của khóa học này', 403);
    }

    return await assignmentRepository.findByCourseId(courseId);
  }

  async getAssignmentById(assignmentId, user) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new AppError('Không tìm thấy bài tập này', 404);
    }

    const course = await courseRepository.findById(assignment.course);
    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    let hasAccess = false;
    if (user.role === 'admin' || instructorId === user.id) {
      hasAccess = true;
    } else {
      const enrollment = await enrollmentRepository.findByStudentAndCourse(user.id, assignment.course);
      if (enrollment && enrollment.paymentStatus === 'completed') {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      throw new AppError('Bạn không có quyền truy cập bài tập này', 403);
    }

    return assignment;
  }

  async submitAssignment(assignmentId, submissionData, user) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new AppError('Không tìm thấy bài tập này', 404);
    }

    const enrollment = await enrollmentRepository.findByStudentAndCourse(user.id, assignment.course);
    if (!enrollment || enrollment.paymentStatus !== 'completed') {
      throw new AppError('Bạn phải đăng ký khóa học này trước khi nộp bài tập', 403);
    }

    // Kiểm tra xem đã có bản nộp chưa
    let submission = await submissionRepository.findByStudentAndAssignment(user.id, assignmentId);
    
    if (submission) {
      if (submission.status === 'graded') {
        throw new AppError('Bài tập này đã được chấm điểm, không thể nộp lại', 400);
      }
      // Cập nhật bản nộp hiện tại
      submission.submittedFiles = submissionData.submittedFiles;
      submission.studentNotes = submissionData.studentNotes;
      await submission.save();
    } else {
      // Tạo bản nộp mới
      submission = await submissionRepository.create({
        assignment: assignmentId,
        student: user.id,
        submittedFiles: submissionData.submittedFiles,
        studentNotes: submissionData.studentNotes
      });
    }

    return submission;
  }

  async getSubmissionsByAssignment(assignmentId, user) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new AppError('Không tìm thấy bài tập này', 404);
    }

    const course = await courseRepository.findById(assignment.course);
    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền xem danh sách bài nộp này', 403);
    }

    return await submissionRepository.findByAssignment(assignmentId);
  }

  async gradeSubmission(submissionId, gradeData, user) {
    const submission = await submissionRepository.findById(submissionId);
    if (!submission) {
      throw new AppError('Không tìm thấy bản nộp này', 404);
    }

    const assignment = await assignmentRepository.findById(submission.assignment);
    if (!assignment) {
      throw new AppError('Không tìm thấy thông tin bài tập tương ứng', 404);
    }

    const course = await courseRepository.findById(assignment.course);
    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền chấm điểm bài nộp này', 403);
    }

    if (gradeData.grade < 0 || gradeData.grade > assignment.maxPoints) {
      throw new AppError(`Điểm số phải nằm trong khoảng từ 0 đến ${assignment.maxPoints}`, 400);
    }

    submission.grade = gradeData.grade;
    submission.feedback = gradeData.feedback || null;
    submission.status = 'graded';
    submission.gradedAt = new Date();

    await submission.save();
    return submission;
  }

  async getStudentSubmission(assignmentId, user) {
    return await submissionRepository.findByStudentAndAssignment(user.id, assignmentId);
  }

  async updateAssignment(assignmentId, updateData, user) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new AppError('Không tìm thấy bài tập này', 404);
    }

    const course = await courseRepository.findById(assignment.course);
    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền chỉnh sửa bài tập này', 403);
    }

    return await assignmentRepository.update(assignmentId, updateData);
  }

  async deleteAssignment(assignmentId, user) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new AppError('Không tìm thấy bài tập này', 404);
    }

    const course = await courseRepository.findById(assignment.course);
    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền xóa bài tập này', 403);
    }

    await submissionRepository.deleteMany({ assignment: assignmentId });
    await assignmentRepository.delete(assignmentId);
    return true;
  }
}

module.exports = new AssignmentService();
