import axiosInstance from './axios';

export interface Quiz {
  _id: string;
  title: string;
  course: string;
  passingScore: number;
  timeLimit?: number;
  scheduledAt?: string;
  dueDate?: string;
  createdAt: string;
}

export interface Question {
  _id?: string;
  quiz?: string;
  text: string;
  points: number;
  options: {
    _id?: string;
    text: string;
    isCorrect?: boolean;
  }[];
  explanation?: string;
}

export interface QuizSubmission {
  questionId: string;
  selectedOptionId: string;
}

export const quizApi = {
  getQuizzesByCourse: (courseId: string) => {
    return axiosInstance.get(`/courses/${courseId}/quizzes`);
  },

  createQuiz: (quizData: any) => {
    return axiosInstance.post('/quizzes', quizData);
  },

  addQuestion: (quizId: string, questionData: any) => {
    return axiosInstance.post(`/quizzes/${quizId}/questions`, questionData);
  },
  
  getQuestionsForTeacher: (quizId: string) => {
    return axiosInstance.get(`/quizzes/${quizId}/questions`);
  },

  getQuizForTake: (quizId: string) => {
    return axiosInstance.get(`/quizzes/${quizId}/take`);
  },

  submitQuiz: (quizId: string, answers: QuizSubmission[]) => {
    return axiosInstance.post(`/quizzes/${quizId}/submit`, { answers });
  },

  getLessonQuestions: (lessonId: string) => {
    return axiosInstance.get(`/quizzes/lessons/${lessonId}/questions`);
  },

  addLessonQuestion: (lessonId: string, questionData: any) => {
    return axiosInstance.post(`/quizzes/lessons/${lessonId}/questions`, questionData);
  },

  generateSmartQuiz: (courseId: string) => {
    return axiosInstance.get(`/quizzes/courses/${courseId}/smart-quiz/generate`);
  },

  submitSmartQuiz: (courseId: string, answers: QuizSubmission[]) => {
    return axiosInstance.post(`/quizzes/courses/${courseId}/smart-quiz/submit`, { answers });
  }
};
