import axiosInstance from './axios';

export interface Assignment {
  _id: string;
  course: string;
  title: string;
  description: string;
  attachmentUrl?: string;
  maxPoints: number;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionFile {
  name: string;
  url: string;
}

export interface AssignmentSubmission {
  _id: string;
  assignment: string | Assignment;
  student: { _id: string; name: string; email: string; avatar?: string };
  submittedFiles: SubmissionFile[];
  studentNotes?: string;
  grade?: number;
  feedback?: string;
  gradedAt?: string;
  status: 'submitted' | 'graded';
  createdAt: string;
  updatedAt: string;
}

export const assignmentApi = {
  getAssignments: async (courseId: string): Promise<Assignment[]> => {
    const response = await axiosInstance.get(`/assignments/course/${courseId}`);
    return response.data.data.assignments;
  },

  getAssignmentById: async (id: string): Promise<Assignment> => {
    const response = await axiosInstance.get(`/assignments/${id}`);
    return response.data.data.assignment;
  },

  createAssignment: async (courseId: string, data: Partial<Assignment>): Promise<Assignment> => {
    const response = await axiosInstance.post(`/assignments/course/${courseId}`, data);
    return response.data.data.assignment;
  },

  getSubmissions: async (assignmentId: string): Promise<AssignmentSubmission[]> => {
    const response = await axiosInstance.get(`/assignments/${assignmentId}/submissions`);
    return response.data.data.submissions;
  },

  submitAssignment: async (assignmentId: string, data: { submittedFiles: SubmissionFile[]; studentNotes?: string }): Promise<AssignmentSubmission> => {
    const response = await axiosInstance.post(`/assignments/${assignmentId}/submit`, data);
    return response.data.data.submission;
  },

  gradeSubmission: async (submissionId: string, data: { grade: number; feedback?: string }): Promise<AssignmentSubmission> => {
    const response = await axiosInstance.patch(`/assignments/submissions/${submissionId}/grade`, data);
    return response.data.data.submission;
  },

  getMySubmission: async (assignmentId: string): Promise<AssignmentSubmission | null> => {
    const response = await axiosInstance.get(`/assignments/${assignmentId}/my-submission`);
    return response.data.data.submission;
  },

  updateAssignment: async (id: string, data: Partial<Assignment>): Promise<Assignment> => {
    const response = await axiosInstance.patch(`/assignments/${id}`, data);
    return response.data.data.assignment;
  },

  deleteAssignment: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/assignments/${id}`);
  }
};
export default assignmentApi;
