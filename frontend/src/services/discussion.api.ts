import axiosInstance from './axios';

export interface UserRef {
  _id: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface Discussion {
  _id: string;
  course: string;
  lesson: string;
  author: UserRef;
  content: string;
  upvotes: string[];
  commentsCount: number;
  isResolved: boolean;
  createdAt: string;
}

export interface Comment {
  _id: string;
  discussion: string;
  author: UserRef;
  content: string;
  upvotes: string[];
  isAcceptedAnswer: boolean;
  createdAt: string;
}

export const discussionApi = {
  getDiscussions: async (courseId: string, lessonId: string) => {
    const res = await axiosInstance.get(`/courses/${courseId}/lessons/${lessonId}/discussions`);
    return res.data;
  },
  
  createDiscussion: async (courseId: string, lessonId: string, content: string) => {
    const res = await axiosInstance.post(`/courses/${courseId}/lessons/${lessonId}/discussions`, { content });
    return res.data;
  },

  getComments: async (courseId: string, lessonId: string, discussionId: string) => {
    const res = await axiosInstance.get(`/courses/${courseId}/lessons/${lessonId}/discussions/${discussionId}/comments`);
    return res.data;
  },

  addComment: async (courseId: string, lessonId: string, discussionId: string, content: string) => {
    const res = await axiosInstance.post(`/courses/${courseId}/lessons/${lessonId}/discussions/${discussionId}/comments`, { content });
    return res.data;
  },

  toggleUpvote: async (courseId: string, lessonId: string, discussionId: string) => {
    const res = await axiosInstance.post(`/courses/${courseId}/lessons/${lessonId}/discussions/${discussionId}/upvote`);
    return res.data;
  }
};
