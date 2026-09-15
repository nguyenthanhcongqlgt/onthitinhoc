import axios from 'axios';
import {
  User,
  ExamInfo,
  ExamFolder,
  ExamStartPayload,
  ExamSessionDetail,
  SystemStats,
  LiveProctorData,
  ExamAnalyticsData,
  StudentAnalyticsData,
  QuestionFeedback,
  ClassRoom,
  ClassRoomDetail,
} from '../types';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'https:' || window.location.hostname.includes('vercel.app')) {
      return 'https://onthitinhoc.onrender.com/api';
    }
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `http://${window.location.hostname}:8000/api`;
    }
  }
  return 'http://127.0.0.1:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Attach JWT Token & Handle FormData headers
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Interceptor: Handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccessToken = res.data.access;
          localStorage.setItem('access_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshErr);  // L5: tránh resolve undefined
        }
      }
    }
    return Promise.reject(error);
  }
);

// AUTH & SUPER ADMIN APIS
export const authApi = {
  login: async (credentials: any) => {
    const res = await apiClient.post('/auth/login/', credentials);
    return res.data;
  },
  register: async (userData: any) => {
    const res = await apiClient.post('/auth/register/', userData);
    return res.data;
  },
  getProfile: async (): Promise<User> => {
    const res = await apiClient.get('/auth/profile/');
    return res.data;
  },
  getPendingTeachers: async (): Promise<User[]> => {
    const res = await apiClient.get('/auth/teachers/pending/');
    return res.data;
  },
  approveTeacher: async (userId: number, status: 'ACTIVE' | 'REJECTED') => {
    const res = await apiClient.post(`/auth/teachers/${userId}/approve/`, { status });
    return res.data;
  },
  getUsers: async (params?: { role?: string; status?: string; class_name?: string; search?: string }): Promise<User[]> => {
    const res = await apiClient.get('/auth/users/', { params });
    return res.data;
  },
  bulkImportUsers: async (users: any[]) => {
    const res = await apiClient.post('/auth/users/bulk-import/', { users });
    return res.data;
  },
  toggleUserStatus: async (userId: number, status: 'ACTIVE' | 'REJECTED' | 'PENDING') => {
    const res = await apiClient.post(`/auth/users/${userId}/toggle-status/`, { status });
    return res.data;
  },
  resetPassword: async (userId: number, newPassword: string) => {
    const res = await apiClient.post(`/auth/users/${userId}/reset-password/`, { new_password: newPassword });
    return res.data;
  },
  updateUser: async (userId: number, data: Partial<User>) => {
    const res = await apiClient.patch(`/auth/users/${userId}/`, data);
    return res.data;
  },
  getSystemStats: async (): Promise<SystemStats> => {
    const res = await apiClient.get('/auth/system-stats/');
    return res.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await apiClient.post('/auth/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return res.data;
  },
};

// 2FA APIS
export const twoFactorApi = {
  setup: async (): Promise<{ secret: string; qr_code: string; provisioning_uri: string }> => {
    const res = await apiClient.post('/auth/2fa/setup/');
    return res.data;
  },
  confirm: async (code: string): Promise<{ success: boolean; detail: string; backup_codes: string[]; user: User }> => {
    const res = await apiClient.post('/auth/2fa/confirm/', { code });
    return res.data;
  },
  disable: async (password: string): Promise<{ success: boolean; detail: string; user: User }> => {
    const res = await apiClient.post('/auth/2fa/disable/', { password });
    return res.data;
  },
  verifyLogin: async (tempToken: string, code: string): Promise<any> => {
    const res = await apiClient.post('/auth/2fa/verify/', { temp_token: tempToken, code });
    return res.data;
  },
};

// EXAMS APIS
export const examsApi = {
  getExams: async (params?: { folder_id?: number | string; include_subfolders?: boolean }): Promise<ExamInfo[]> => {
    const res = await apiClient.get('/exams/', { params });
    return res.data;
  },
  getExamDetail: async (examId: number): Promise<ExamInfo> => {
    const res = await apiClient.get(`/exams/${examId}/`);
    return res.data;
  },
  verifyAccessCode: async (examId: number, code: string) => {
    const res = await apiClient.post(`/exams/${examId}/verify-code/`, { access_code: code });
    return res.data;
  },
  quickJoinExam: async (code: string, accessCode?: string, selectedExamId?: number) => {
    const res = await apiClient.post('/exams/quick-join/', { 
      code, 
      access_code: accessCode || '',
      selected_exam_id: selectedExamId 
    });
    return res.data;
  },
  assignExam: async (examId: number, data: {
    is_assigned: boolean;
    assigned_classes?: string;
    assigned_start_time?: string | null;
    assigned_end_time?: string | null;
    max_attempts?: number;
    show_score_after_test?: boolean;
    show_explanation_after_test?: boolean;
    allow_run_code?: boolean;
    branch_mode?: 'SINGLE' | 'BOTH';
    access_code?: string;
    access_type?: string;
  }) => {
    const res = await apiClient.post(`/exams/${examId}/assign/`, data);
    return res.data;
  },
  deleteExam: async (examId: number) => {
    const res = await apiClient.delete(`/exams/${examId}/`);
    return res.data;
  },
  getExamAnalytics: async (examId: number): Promise<ExamAnalyticsData> => {
    const res = await apiClient.get(`/exams/${examId}/analytics/`);
    return res.data;
  },
  getExamShareStatus: async (examId: number) => {
    const res = await apiClient.get(`/exams/${examId}/share/`);
    return res.data;
  },
  updateExamShare: async (examId: number, data: { teacher_ids: number[]; is_shared_with_all_teachers: boolean }) => {
    const res = await apiClient.post(`/exams/${examId}/share/`, data);
    return res.data;
  },
  // Feedback & Question Dispute APIs
  submitQuestionFeedback: async (data: {
    exam: number;
    question: number;
    session_id?: number | null;
    feedback_type: string;
    student_note: string;
    suggested_option?: string;
  }) => {
    const res = await apiClient.post('/feedbacks/', data);
    return res.data;
  },
  getQuestionFeedbacks: async (params?: { exam?: number; status?: string }): Promise<QuestionFeedback[]> => {
    const res = await apiClient.get('/feedbacks/', { params });
    return res.data;
  },
  reviewQuestionFeedback: async (feedbackId: number, data: {
    status: 'ACCEPTED' | 'REJECTED';
    teacher_reply?: string;
    correct_option_id?: number;
    part2_correct_keys?: Record<string, boolean>;
    auto_regrade?: boolean;
  }) => {
    const res = await apiClient.post(`/feedbacks/${feedbackId}/review/`, data);
    return res.data;
  },
  importDocx: async (payload: FormData | Record<string, any>) => {
    const isFormData = payload instanceof FormData;
    const res = await apiClient.post('/exams/import-docx/', payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return res.data;
  },
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await apiClient.post('/exams/upload-image/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  downloadDocxTemplate: async () => {
    const res = await apiClient.get('/exams/template-docx/', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Mau_De_Thi_HSG_THPT_Quat_Lam.docx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

// EXAM FOLDERS APIS
export const foldersApi = {
  getFolders: async (params?: { is_shared?: boolean | string; parent?: number | string; scope?: string }): Promise<ExamFolder[]> => {
    const res = await apiClient.get('/folders/', { params });
    return res.data;
  },
  createFolder: async (data: Partial<ExamFolder>): Promise<ExamFolder> => {
    const res = await apiClient.post('/folders/', data);
    return res.data;
  },
  updateFolder: async (folderId: number, data: Partial<ExamFolder>): Promise<ExamFolder> => {
    const res = await apiClient.patch(`/folders/${folderId}/`, data);
    return res.data;
  },
  deleteFolder: async (folderId: number): Promise<void> => {
    await apiClient.delete(`/folders/${folderId}/`);
  },
  moveExams: async (examIds: number[], targetFolderId: number | null): Promise<{ success: boolean; message: string; moved_count: number }> => {
    const res = await apiClient.post('/folders/move-exams/', {
      exam_ids: examIds,
      target_folder_id: targetFolderId,
    });
    return res.data;
  },
};

// EXAM SITTINGS APIS
export const sittingsApi = {
  list: async (): Promise<any[]> => {
    const res = await apiClient.get('/sittings/');
    return res.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/sittings/', data);
    return res.data;
  },
  detail: async (id: number) => {
    const res = await apiClient.get(`/sittings/${id}/`);
    return res.data;
  },
  update: async (id: number, data: any) => {
    const res = await apiClient.patch(`/sittings/${id}/`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await apiClient.delete(`/sittings/${id}/`);
    return res.data;
  },
  activate: async (id: number) => {
    const res = await apiClient.post(`/sittings/${id}/activate/`);
    return res.data;
  },
  deactivate: async (id: number) => {
    const res = await apiClient.post(`/sittings/${id}/deactivate/`);
    return res.data;
  },
  results: async (id: number) => {
    const res = await apiClient.get(`/sittings/${id}/results/`);
    return res.data;
  },
};

// ASSESSMENT & EXAM ROOM APIS
export const assessmentApi = {
  regradeExam: async (examId: number) => {
    const res = await apiClient.post(`/assessment/exams/${examId}/regrade/`);
    return res.data;
  },
  getLiveProctor: async (examId: number): Promise<LiveProctorData> => {
    const res = await apiClient.get(`/assessment/exams/${examId}/live-proctor/`);
    return res.data;
  },
  controlSession: async (sessionId: number, action: 'unlock' | 'add_extra_time' | 'force_submit', extraData?: any) => {
    const res = await apiClient.post(`/assessment/sessions/${sessionId}/control/`, {
      action,
      ...extraData,
    });
    return res.data;
  },
  autoSaveDraft: async (sessionId: number, draft: any) => {
    const res = await apiClient.post(`/assessment/sessions/${sessionId}/auto-save/`, { draft });
    return res.data;
  },
  getDraft: async (sessionId: number) => {
    const res = await apiClient.get(`/assessment/sessions/${sessionId}/auto-save/`);
    return res.data;
  },
  getStudentAnalytics: async (): Promise<StudentAnalyticsData> => {
    const res = await apiClient.get('/assessment/student-analytics/');
    return res.data;
  },
  startExam: async (examId: number): Promise<ExamStartPayload> => {
    const res = await apiClient.post(`/assessment/exams/${examId}/start/`);
    return res.data;
  },
  selectBranch: async (sessionId: number, branch: 'CS' | 'ICT') => {
    const res = await apiClient.post(`/assessment/sessions/${sessionId}/select-branch/`, { branch });
    return res.data;
  },
  logViolation: async (
    sessionId: number,
    violationType: string,
    details?: string,
    currentAnswers?: { part1_answers: any[]; part2_answers: any[] }
  ) => {
    const payload = {
      violation_type: violationType,
      details: details || '',
      ...currentAnswers,
    };
    const res = await apiClient.post(`/assessment/sessions/${sessionId}/log-violation/`, payload);
    return res.data;
  },
  submitExam: async (
    sessionId: number,
    data: {
      part1_answers: Array<{ question_id: number; selected_option_id: number | null }>;
      part2_answers: Array<{ question_id: number; sub_answers: Record<string, boolean> }>;
      selected_branch: 'CS' | 'ICT' | 'BOTH';
    }
  ) => {
    const res = await apiClient.post(`/assessment/sessions/${sessionId}/submit/`, data);
    return res.data;
  },
  getSessions: async (): Promise<ExamSessionDetail[]> => {
    const res = await apiClient.get('/assessment/sessions/');
    return res.data;
  },
  getSessionDetail: async (sessionId: number): Promise<ExamSessionDetail> => {
    const res = await apiClient.get(`/assessment/sessions/${sessionId}/`);
    return res.data;
  },
};

// AI INTEGRATION APIS
export const aiApi = {
  getSettings: async () => {
    const res = await apiClient.get('/exams/ai-settings/');
    return res.data;
  },
  saveSettings: async (payload: {
    provider?: string;
    model?: string;
    api_key?: string;
    base_url?: string;
    auto_explain?: boolean;
    use_shared_admin_api?: boolean;
    share_with_teachers?: boolean;
    clear_key?: boolean;
  }) => {
    const res = await apiClient.post('/exams/ai-settings/', payload);
    return res.data;
  },
  toggleTeacherAccess: async (teacherId: number, granted: boolean) => {
    const res = await apiClient.post('/exams/ai-settings/toggle-teacher-access/', {
      teacher_id: teacherId,
      granted,
    });
    return res.data;
  },
  grantAllTeachersAccess: async (grantAll: boolean) => {
    const res = await apiClient.post('/exams/ai-settings/toggle-teacher-access/', {
      grant_all: grantAll,
    });
    return res.data;
  },
  testConnection: async (payload: {
    provider?: string;
    api_key?: string;
    model?: string;
    base_url?: string;
    use_shared_admin_api?: boolean;
  }) => {
    const res = await apiClient.post('/exams/ai-test-connection/', payload);
    return res.data;
  },
  solveExam: async (payload: {
    questions?: any[];
    text?: string;
    provider?: string;
    api_key?: string;
    model?: string;
    base_url?: string;
    use_shared_admin_api?: boolean;
    solve_mode?: 'unanswered_only' | 'all' | 'selected_only';
    selected_indices?: number[];
    include_explanations?: boolean;
  }) => {
    const res = await apiClient.post('/exams/ai-solve/', payload);
    return res.data;
  },
};

// CLASSROOM APIS
export const classApi = {
  getClasses: async (): Promise<ClassRoom[]> => {
    const res = await apiClient.get('/classes/');
    return res.data;
  },
  getClassDetail: async (id: number): Promise<ClassRoomDetail> => {
    const res = await apiClient.get(`/classes/${id}/`);
    return res.data;
  },
  createClass: async (data: {
    name: string;
    grade?: string;
    school_year?: string;
    description?: string;
  }): Promise<ClassRoom> => {
    const res = await apiClient.post('/classes/', data);
    return res.data;
  },
  updateClass: async (id: number, data: Partial<ClassRoom>): Promise<ClassRoom> => {
    const res = await apiClient.patch(`/classes/${id}/`, data);
    return res.data;
  },
  deleteClass: async (id: number) => {
    const res = await apiClient.delete(`/classes/${id}/`);
    return res.data;
  },
  addStudents: async (classId: number, studentIds: number[]) => {
    const res = await apiClient.post(`/classes/${classId}/students/`, {
      student_ids: studentIds,
    });
    return res.data;
  },
  removeStudent: async (classId: number, studentId: number) => {
    const res = await apiClient.delete(`/classes/${classId}/students/${studentId}/`);
    return res.data;
  },
  getAvailableStudents: async (search?: string, className?: string): Promise<User[]> => {
    const res = await apiClient.get('/classes/available-students/', {
      params: { search, class_name: className },
    });
    return res.data;
  },
  joinClassByCode: async (code: string) => {
    const res = await apiClient.post('/classes/join/', { code });
    return res.data;
  },
};


// QUESTION BANK API
export const bankApi = {
  // Categories
  getCategories: async (): Promise<any[]> => {
    const res = await apiClient.get('/bank/categories/');
    return res.data;
  },
  createCategory: async (data: { name: string; description?: string; parent?: number | null }) => {
    const res = await apiClient.post('/bank/categories/', data);
    return res.data;
  },
  updateCategory: async (id: number, data: any) => {
    const res = await apiClient.patch(`/bank/categories/${id}/`, data);
    return res.data;
  },
  deleteCategory: async (id: number) => {
    const res = await apiClient.delete(`/bank/categories/${id}/`);
    return res.data;
  },

  // Questions
  getQuestions: async (params?: any): Promise<any[]> => {
    const res = await apiClient.get('/bank/questions/', { params });
    return res.data;
  },
  createQuestion: async (data: any) => {
    const res = await apiClient.post('/bank/questions/', data);
    return res.data;
  },
  updateQuestion: async (id: number, data: any) => {
    const res = await apiClient.patch(`/bank/questions/${id}/`, data);
    return res.data;
  },
  deleteQuestion: async (id: number) => {
    const res = await apiClient.delete(`/bank/questions/${id}/`);
    return res.data;
  },
  cloneToExam: async (questionId: number, examId: number) => {
    const res = await apiClient.post(`/bank/questions/${questionId}/clone_to_exam/`, { exam_id: examId });
    return res.data;
  },
};
