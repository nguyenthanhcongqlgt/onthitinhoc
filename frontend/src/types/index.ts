export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'REJECTED';

// QUESTION BANK TYPES
export interface BankQuestionOption {
  id?: number;
  label: string;
  content: string;
  code_snippet?: string;
  is_correct: boolean;
  order_index?: number;
  explanation?: string;
}

export interface BankQuestion {
  id?: number;
  category?: number | null;
  category_name?: string;
  part_type: PartType;
  branch: Branch;
  content: string;
  code_snippet?: string;
  code_language?: string;
  competency_category: string;
  difficulty_level: Difficulty;
  explanation?: string;
  options: BankQuestionOption[];
  created_by_name?: string;
  created_at?: string;
}

export interface QuestionCategory {
  id: number;
  name: string;
  description?: string;
  parent?: number | null;
  created_by_name?: string;
  created_at?: string;
  question_count?: number;
}


export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  phone_number?: string;
  school: string;
  class_name?: string;
  student_id?: string;
  is_two_factor_enabled?: boolean;
  created_at: string;
}

export type AccessType = 'PUBLIC' | 'PROTECTED' | 'ASSIGNED';
export type PartType = 'PART_I' | 'PART_II';
export type Branch = 'COMMON' | 'CS' | 'ICT';
export type BranchMode = 'SINGLE' | 'BOTH';
export type Difficulty = 'NB' | 'TH' | 'VD' | 'VDC';

export interface QuestionOptionMasked {
  id: number;
  display_label: string;
  content: string;
  code_snippet?: string;
  is_correct?: boolean;
  explanation?: string;
}

export interface QuestionMasked {
  id: number;
  display_number: number;
  part_type: PartType;
  branch: Branch;
  point?: number;
  content: string;
  code_snippet?: string;
  code_language: string;
  competency_category: string;
  difficulty_level: Difficulty;
  explanation?: string;
  options: QuestionOptionMasked[];
}

export interface ExamFolder {
  id: number;
  name: string;
  description?: string;
  parent: number | null;
  parent_name?: string;
  creator: number | null;
  creator_name?: string;
  is_shared: boolean;
  color: string;
  icon: string;
  order_index: number;
  exam_count: number;
  children_count?: number;
  full_path?: string;
  path_display?: string;
  is_owner?: boolean;
  children?: ExamFolder[];
  created_at?: string;
  updated_at?: string;
}

export interface ExamInfo {
  id: number;
  title: string;
  description: string;
  folder?: number | null;
  folder_name?: string;
  folder_path?: string;
  folder_color?: string;
  exam_type?: 'HSG' | 'TN_THPT';
  exam_type_display?: string;
  is_owner?: boolean;
  is_shared?: boolean;
  is_shared_with_all_teachers?: boolean;
  shared_teachers_count?: number;
  duration_minutes: number;
  max_tab_violations: number;
  part1_total_points?: number;
  part2_total_points?: number;
  total_points?: number;
  part1_point_per_question: number;
  part2_matrix_rules: Record<string, number>;
  matrix_preset?: string;
  branch_mode?: BranchMode;
  questions_count?: {
    total: number;
    part1: number;
    part2_cs: number;
    part2_ict: number;
  };
  access_type?: AccessType;
  access_code?: string;
  is_assigned?: boolean;
  assigned_classes?: string;
  assigned_start_time?: string | null;
  assigned_end_time?: string | null;
  max_attempts?: number;
  allow_run_code?: boolean;
  show_score_after_test?: boolean;
  show_explanation_after_test?: boolean;
  creator_name?: string;
  created_at?: string;
  questions?: any[];
}

export interface ExamSitting {
  id: number;
  name: string;
  description: string;
  room_code: string;
  password?: string;
  creator: number;
  creator_name: string;
  assigned_classes: string;
  start_time: string | null;
  end_time: string | null;
  max_attempts: number;
  allow_run_code: boolean;
  distribution_mode: 'RANDOM' | 'ROUND_ROBIN' | 'MANUAL';
  is_active: boolean;
  show_score_after_test: boolean;
  show_explanation_after_test: boolean;
  exams_count: number;
  exams_detail: {
    id: number;
    title: string;
    questions_count: number;
    duration_minutes: number;
  }[];
  total_students: number;
  created_at: string;
  updated_at: string;
}

export interface SittingAssignment {
  id: number;
  sitting: number;
  student: number;
  student_name: string;
  student_class: string;
  student_id_code: string;
  exam: number;
  exam_title: string;
  assigned_at: string;
}

export interface ExamStartPayload {
  session_id: number;
  is_preview?: boolean;
  start_time: string;
  selected_branch: 'NONE' | 'CS' | 'ICT' | 'BOTH';
  violation_count: number;

  max_tab_violations: number;
  data: {
    exam: ExamInfo;
    part1_questions: QuestionMasked[];
    part2_common_questions?: QuestionMasked[];
    part2_branches: {
      CS: QuestionMasked[];
      ICT: QuestionMasked[];
    };
  };
}

export interface CompetencyScore {
  earned: number;
  max: number;
  percentage: number;
}

export interface ViolationLog {
  id: number;
  violation_type: string;
  violation_type_display: string;
  violation_number: number;
  timestamp: string;
  details?: string;
}

export interface StudentAnswerDetail {
  id: number;
  question: number;
  question_content: string;
  question_part: PartType;
  question_branch: Branch;
  question_point?: number;
  question_explanation?: string;
  selected_option?: number;
  selected_option_label?: string;
  part2_answers: Record<string, boolean>;
  is_correct: boolean;
  correct_subitems_count: number;
  score_awarded: number;
}

export interface ExamSessionDetail {
  id: number;
  student: number;
  student_name: string;
  student_class: string;
  exam: number;
  exam_title: string;
  exam_total_points?: number;
  exam_part1_total_points?: number;
  exam_part2_total_points?: number;
  selected_branch: 'NONE' | 'CS' | 'ICT' | 'BOTH';
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'LOCKED_VIOLATION' | 'CANCELLED';
  status_display: string;
  start_time: string;
  submit_time?: string;
  total_score: number;
  part1_score: number;
  part2_score: number;
  part1_correct_count: number;
  part2_correct_subitems_count: number;
  violation_count: number;
  is_locked: boolean;
  lock_reason?: string;
  competency_scores: Record<string, CompetencyScore>;
  answers?: StudentAnswerDetail[];
  violations?: ViolationLog[];
  show_score_after_test?: boolean;
  show_explanation_after_test?: boolean;
}

export type FeedbackType = 'WRONG_KEY' | 'WRONG_CONTENT' | 'TYPO' | 'OTHER';
export type FeedbackStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface QuestionFeedback {
  id: number;
  student: number;
  student_name: string;
  student_class: string;
  exam: number;
  exam_title: string;
  question: number;
  question_content: string;
  question_order_index: number;
  question_part: string;
  question_branch: string;
  session_id?: number | null;
  feedback_type: FeedbackType;
  feedback_type_display: string;
  student_note: string;
  suggested_option?: string;
  status: FeedbackStatus;
  status_display: string;
  teacher_reply?: string;
  reviewed_by?: number | null;
  reviewer_name?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemStats {
  total_students: number;
  total_teachers: number;
  pending_teachers: number;
  total_exams: number;
  active_exams: number;
  total_questions: number;
  total_completed_sessions: number;
  average_score: number;
  classes_distribution: Array<{ class_name: string; count: number }>;
}

export interface ProctorCandidate {
  session_id: number;
  student_id: number;
  username: string;
  full_name: string;
  class_name: string;
  school_id: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'LOCKED_VIOLATION' | 'CANCELLED';
  status_display: string;
  is_locked: boolean;
  lock_reason: string;
  violation_count: number;
  max_violations: number;
  extra_time_minutes: number;
  start_time: string;
  submit_time?: string;
  total_score?: number | null;
  answered_count: number;
  total_questions: number;
  progress_percentage: number;
  selected_branch: string;
}

export interface LiveProctorData {
  exam_id: number;
  exam_title: string;
  duration_minutes: number;
  total_candidates: number;
  in_progress_count: number;
  submitted_count: number;
  locked_count: number;
  candidates: ProctorCandidate[];
}

export interface QuestionAnalyticsItem {
  question_id: number;
  part_type: PartType;
  branch: Branch;
  order_index: number;
  content_snippet: string;
  facility_index: number;
  difficulty_label: string;
  discrimination_index: number;
  competency_category: string;
}

export interface ExamAnalyticsData {
  exam_id: number;
  exam_title: string;
  total_submissions: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  max_scale: number;
  score_distribution: Array<{ range: string; count: number; min: number; max: number }>;
  questions_analysis: QuestionAnalyticsItem[];
  branch_stats: {
    CS: number;
    ICT: number;
  };
}

export interface StudentAnalyticsData {
  total_exams_taken: number;
  average_score: number;
  highest_score: number;
  score_history: Array<{
    exam_id: number;
    exam_title: string;
    score: number;
    submit_time: string;
  }>;
  radar_scores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
}

export type GradeLevel = '10' | '11' | '12' | 'HSG' | 'OTHER';

export interface ClassRoom {
  id: number;
  name: string;
  code: string;
  grade: GradeLevel;
  grade_display: string;
  school_year: string;
  description: string;
  teacher: number;
  teacher_name?: string;
  teacher_username?: string;
  students_count: number;
  created_at: string;
  updated_at: string;
}

export interface ClassRoomDetail extends ClassRoom {
  students: User[];
}


