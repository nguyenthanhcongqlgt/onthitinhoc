import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Key,
  Globe,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Eye,
  EyeOff,
  Cpu,
  Zap,
  ShieldCheck,
  Users,
  Search,
  Check,
  RotateCw,
  Lock,
  UserCheck,
  UserX,
} from 'lucide-react';
import { aiApi } from '../../services/api';

export interface AISettings {
  provider: 'gemini' | 'openai';
  apiKey: string;
  model: string;
  baseUrl?: string;
  autoExplain: boolean;
  useSharedAdminApi: boolean;
  shareWithTeachers: boolean;
  hasApiKey: boolean;
  maskedApiKey: string;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-3.6-flash',
  baseUrl: '',
  autoExplain: true,
  useSharedAdminApi: false,
  shareWithTeachers: true,
  hasApiKey: false,
  maskedApiKey: '',
};

export const AI_PROVIDERS = [
  {
    id: 'gemini' as const,
    name: 'Google Gemini',
    badge: 'Khuyên dùng • Miễn phí',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: '🌟',
    description: 'Ưu tiên Gemini 3.6 Flash & Gemini 3.5 Flash Lite để đạt tốc độ siêu nhanh và ổn định cao nhất, không lo quá tải.',
    defaultModel: 'gemini-3.6-flash',
    models: [
      { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (⭐ Khuyên dùng - Cực nhanh, 100% ổn định)' },
      { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (🚀 Dự phòng chính - Hạn mức Khủng 500 lượt/ngày, 15 RPM)' },
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (🔥 Dự phòng 500 lượt/ngày, 15 RPM)' },
      { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (Đỉnh cao suy luận - Có thể gặp 503 khi Google quá tải)' },
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Thế hệ mới)' },
      { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Thế hệ 3.5)' },
    ],
    keyUrl: 'https://aistudio.google.com/app/apikey',
    keyGuide: 'Lấy API Key miễn phí tại Google AI Studio',
    keyPlaceholder: 'Dán API Key Google Gemini tại đây (Google AI Studio / Vertex AI / Proxy)',
  },
  {
    id: 'openai' as const,
    name: 'OpenAI ChatGPT',
    badge: 'Tiêu chuẩn • Phổ biến',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: '🤖',
    description: 'Mô hình GPT-4o / GPT-4.5 giải bài tập lập trình và lý thuyết rất thông minh, chuẩn xác.',
    defaultModel: 'gpt-4o-mini',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Khuyên dùng - Tiết kiệm chi phí & Nhanh)' },
      { id: 'gpt-4o', name: 'GPT-4o (Mô hình đa năng mạnh mẽ)' },
      { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview (Siêu mô hình thế hệ mới)' },
      { id: 'o3-mini', name: 'o3-mini (Tư duy suy luận logic & Thuật toán HSG cao cấp)' },
      { id: 'o1', name: 'o1 (Mô hình tư duy chuyên sâu)' },
      { id: 'o1-mini', name: 'o1-mini (Mô hình suy luận nhỏ gọn)' },
    ],
    keyUrl: 'https://platform.openai.com/api-keys',
    keyGuide: 'Lấy API Key tại OpenAI Platform',
    keyPlaceholder: 'Dán API Key OpenAI tại đây (sk-... hoặc token tùy chỉnh)',
  },
];

export const getStoredAISettings = (): AISettings => {
  try {
    const raw = localStorage.getItem('ai_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.provider !== 'gemini' && parsed.provider !== 'openai') {
        parsed.provider = 'gemini';
        parsed.model = 'gemini-3.7-flash';
      }
      return { ...DEFAULT_AI_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Error loading AI settings from localStorage:', e);
  }
  return DEFAULT_AI_SETTINGS;
};

export const saveStoredAISettings = (settings: AISettings) => {
  try {
    localStorage.setItem('ai_settings', JSON.stringify({
      provider: settings.provider,
      model: settings.model,
      baseUrl: settings.baseUrl,
      autoExplain: settings.autoExplain,
      useSharedAdminApi: settings.useSharedAdminApi,
    }));
  } catch (e) {
    console.error('Error saving AI settings to localStorage:', e);
  }
};

interface TeacherAccessItem {
  id: number;
  username: string;
  full_name: string;
  email: string;
  school: string;
  class_name: string;
  status: string;
  is_granted: boolean;
  isUpdating?: boolean;
}

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (settings: AISettings) => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [activeTab, setActiveTab] = useState<'config' | 'sharing'>('config');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  // Sharing & Role states
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [sharedAdminInfo, setSharedAdminInfo] = useState<{
    admin_name: string;
    admin_has_api: boolean;
    admin_provider: string;
    admin_model: string;
    is_granted_shared_access: boolean;
  }>({
    admin_name: 'Super Admin (Thầy Công)',
    admin_has_api: false,
    admin_provider: 'gemini',
    admin_model: 'gemini-3.7-flash',
    is_granted_shared_access: false,
  });

  const [teachersList, setTeachersList] = useState<TeacherAccessItem[]>([]);
  const [teacherSearch, setTeacherSearch] = useState<string>('');
  const [isBulkUpdating, setIsBulkUpdating] = useState<boolean>(false);

  // Test connection & feedback
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  const fetchAISettings = async () => {
    setIsLoading(true);
    setTestResult(null);
    try {
      const data = await aiApi.getSettings();
      if (data) {
        setIsAdmin(Boolean(data.is_admin));
        if (data.shared_admin_info) {
          setSharedAdminInfo(data.shared_admin_info);
        }
        if (data.teachers_access_list) {
          setTeachersList(data.teachers_access_list);
        }

        if (data.user_settings) {
          const s = data.user_settings;
          const loadedSettings: AISettings = {
            provider: (s.provider === 'openai' ? 'openai' : 'gemini'),
            apiKey: '',
            model: s.model || (s.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-3.7-flash'),
            baseUrl: s.base_url || '',
            autoExplain: s.auto_explain !== undefined ? Boolean(s.auto_explain) : true,
            useSharedAdminApi: Boolean(s.use_shared_admin_api),
            shareWithTeachers: s.share_with_teachers !== undefined ? Boolean(s.share_with_teachers) : true,
            hasApiKey: Boolean(s.has_api_key),
            maskedApiKey: s.masked_api_key || '',
          };
          setSettings(loadedSettings);
          saveStoredAISettings(loadedSettings);
        }
      }
    } catch (err: any) {
      console.error('Error fetching AI settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAISettings();
      setApiKeyInput('');
      setShowApiKey(false);
      setTestResult(null);
      setSaveSuccess(false);
      setActionSuccessMsg('');
      setActiveTab('config');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentProviderConfig = AI_PROVIDERS.find((p) => p.id === settings.provider) || AI_PROVIDERS[0];

  const handleProviderChange = (providerId: 'gemini' | 'openai') => {
    const pConfig = AI_PROVIDERS.find((p) => p.id === providerId) || AI_PROVIDERS[0];
    setSettings((prev) => ({
      ...prev,
      provider: providerId,
      model: pConfig.defaultModel,
    }));
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const payload: any = {
        provider: settings.provider,
        model: settings.model,
        base_url: settings.baseUrl?.trim() || undefined,
        use_shared_admin_api: settings.useSharedAdminApi,
      };

      if (!settings.useSharedAdminApi) {
        if (apiKeyInput.trim()) {
          payload.api_key = apiKeyInput.trim();
        } else if (!settings.hasApiKey) {
          setTestResult({
            success: false,
            message: 'Vui lòng nhập API Key trước khi kiểm tra kết nối.',
          });
          setIsTesting(false);
          return;
        }
      }

      const data = await aiApi.testConnection(payload);

      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || `✓ Kết nối thành công tới ${currentProviderConfig.name}!`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Kiểm tra thất bại. Vui lòng kiểm tra lại API Key hoặc quyền sử dụng.',
        });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Không thể kết nối đến máy chủ AI.';
      setTestResult({
        success: false,
        message: errMsg,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setTestResult(null);

    try {
      const payload: any = {
        provider: settings.provider,
        model: settings.model,
        base_url: settings.baseUrl?.trim() || '',
        auto_explain: settings.autoExplain,
        use_shared_admin_api: settings.useSharedAdminApi,
        share_with_teachers: settings.shareWithTeachers,
      };

      if (apiKeyInput.trim()) {
        payload.api_key = apiKeyInput.trim();
      }

      const res = await aiApi.saveSettings(payload);
      if (res.user_settings) {
        const s = res.user_settings;
        const updated: AISettings = {
          ...settings,
          hasApiKey: Boolean(s.has_api_key),
          maskedApiKey: s.masked_api_key || '',
          apiKey: '',
        };
        setSettings(updated);
        saveStoredAISettings(updated);
        if (onSaved) onSaved(updated);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Lưu cấu hình thất bại.';
      setTestResult({
        success: false,
        message: errMsg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTeacherAccess = async (teacherId: number, currentGranted: boolean) => {
    setTeachersList((prev) =>
      prev.map((t) => (t.id === teacherId ? { ...t, isUpdating: true } : t))
    );

    try {
      const res = await aiApi.toggleTeacherAccess(teacherId, !currentGranted);
      setTeachersList((prev) =>
        prev.map((t) =>
          t.id === teacherId ? { ...t, is_granted: !currentGranted, isUpdating: false } : t
        )
      );
      setActionSuccessMsg(res.message || '✓ Đã cập nhật quyền thành công!');
      setTimeout(() => setActionSuccessMsg(''), 3500);
    } catch (err: any) {
      console.error('Toggle error:', err);
      setTeachersList((prev) =>
        prev.map((t) => (t.id === teacherId ? { ...t, isUpdating: false } : t))
      );
      alert('Không thể cập nhật quyền cho giáo viên này.');
    }
  };

  const handleBulkGrant = async (grantAll: boolean) => {
    if (
      !window.confirm(
        grantAll
          ? 'Bạn có chắc chắn muốn CẤP QUYỀN sử dụng API của bạn cho TẤT CẢ giáo viên?'
          : 'Bạn có chắc chắn muốn THU HỒI QUYỀN sử dụng API của tất cả giáo viên?'
      )
    ) {
      return;
    }

    setIsBulkUpdating(true);
    try {
      const res = await aiApi.grantAllTeachersAccess(grantAll);
      setTeachersList((prev) => prev.map((t) => ({ ...t, is_granted: grantAll })));
      setActionSuccessMsg(res.message || '✓ Đã cập nhật quyền thành công!');
      setTimeout(() => setActionSuccessMsg(''), 3500);
    } catch (err: any) {
      console.error('Bulk grant error:', err);
      alert('Lỗi cập nhật hàng loạt.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const filteredTeachers = teachersList.filter((t) => {
    const q = teacherSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      t.full_name?.toLowerCase().includes(q) ||
      t.username?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.class_name?.toLowerCase().includes(q)
    );
  });

  const grantedCount = teachersList.filter((t) => t.is_granted).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-slate-950 p-6 shadow-2xl space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Cài đặt Trí Tuệ Nhân Tạo (AI Assistant)
                {isAdmin && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    👑 Super Admin
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Tích hợp AI để tự động giải đề thi Tin học, phân tích thuật toán và sinh lời giải chi tiết
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation for Admin */}
        {isAdmin && (
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'config'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span>Cấu hình AI & API Master</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sharing')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
                activeTab === 'sharing'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Phân quyền Giáo viên ({grantedCount}/{teachersList.length})</span>
              {grantedCount > 0 && (
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RotateCw className="h-7 w-7 animate-spin text-blue-400" />
            <span className="text-xs">Đang tải cấu hình AI và phân quyền bảo mật...</span>
          </div>
        ) : activeTab === 'sharing' && isAdmin ? (
          /* TAB 2: Super Admin Teacher Permission Management */
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-200 flex items-start gap-2.5">
              <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-white block">Cơ chế Bảo mật Zero-Leakage:</span>
                <p className="text-[11px] leading-relaxed text-indigo-200/90">
                  Khi bạn cấp quyền, giáo viên được chọn có thể sử dụng trực tiếp tài nguyên API của bạn để giải đề qua máy chủ an toàn. <strong>Khóa API thật của bạn sẽ KHÔNG BAO GIỜ bị lộ hoặc gửi về trình duyệt của giáo viên.</strong>
                </p>
              </div>
            </div>

            {actionSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            {/* Search and Bulk Grant Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  placeholder="Tìm giáo viên..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  disabled={isBulkUpdating}
                  onClick={() => handleBulkGrant(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[11px] font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Cấp quyền tất cả</span>
                </button>
                <button
                  type="button"
                  disabled={isBulkUpdating}
                  onClick={() => handleBulkGrant(false)}
                  className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-700/60 text-red-300 text-[11px] font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <UserX className="h-3.5 w-3.5 text-red-400" />
                  <span>Thu hồi tất cả</span>
                </button>
              </div>
            </div>

            {/* Teachers List Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 max-h-72 overflow-y-auto divide-y divide-slate-800/80">
              {filteredTeachers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Không tìm thấy giáo viên nào phù hợp.
                </div>
              ) : (
                filteredTeachers.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white truncate">
                          {t.full_name || t.username}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          (@{t.username})
                        </span>
                        {t.is_granted ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Đã cấp quyền
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            Chưa cấp
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {t.school || 'THPT Quất Lâm'} • {t.class_name || 'Bộ môn Tin học'} • {t.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={t.isUpdating}
                      onClick={() => handleToggleTeacherAccess(t.id, t.is_granted)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                        t.is_granted
                          ? 'bg-emerald-600 hover:bg-red-600 text-white'
                          : 'bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white'
                      }`}
                      title={t.is_granted ? 'Nhấn để thu hồi quyền' : 'Nhấn để cấp quyền'}
                    >
                      {t.isUpdating ? (
                        <RotateCw className="h-3.5 w-3.5 animate-spin" />
                      ) : t.is_granted ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Đang cho phép</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5" />
                          <span>Cấp quyền</span>
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* TAB 1: Main AI Configuration */
          <div className="space-y-4">
            {/* Mode Selector for Teachers */}
            {!isAdmin && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Nguồn sử dụng AI (AI Source):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Shared API from Super Admin */}
                  <button
                    type="button"
                    onClick={() => {
                      if (sharedAdminInfo.is_granted_shared_access) {
                        setSettings({ ...settings, useSharedAdminApi: true });
                        setTestResult(null);
                      } else {
                        alert('Bạn chưa được Super Admin (Thầy Công) cấp quyền sử dụng API dùng chung. Vui lòng liên hệ Admin hoặc sử dụng API Key cá nhân của bạn.');
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      settings.useSharedAdminApi
                        ? 'border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-500/50 shadow-lg'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">🛡️</span>
                        {sharedAdminInfo.is_granted_shared_access ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ✓ Đã được cấp quyền
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            🔒 Chưa cấp quyền
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white">API Super Admin chia sẻ</h4>
                      <p className="text-[10px] text-slate-400 leading-tight mt-1">
                        Sử dụng trực tiếp tài nguyên AI của nhà trường ({sharedAdminInfo.admin_provider.toUpperCase()} - {sharedAdminInfo.admin_model}). Không cần nhập API Key.
                      </p>
                    </div>
                    {settings.useSharedAdminApi && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 mt-2">
                        <CheckCircle2 className="h-3 w-3" /> Đang sử dụng
                      </div>
                    )}
                  </button>

                  {/* Option 2: Personal API Key */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({ ...settings, useSharedAdminApi: false });
                      setTestResult(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      !settings.useSharedAdminApi
                        ? 'border-blue-500 bg-blue-950/40 ring-2 ring-blue-500/50 shadow-lg'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">🔑</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Cá nhân
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white">API Key cá nhân của tôi</h4>
                      <p className="text-[10px] text-slate-400 leading-tight mt-1">
                        Sử dụng API Key riêng do bạn tự cung cấp (Gemini / ChatGPT). Bảo mật 100%, chỉ bạn mới có quyền xem và sửa.
                      </p>
                    </div>
                    {!settings.useSharedAdminApi && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-blue-400 mt-2">
                        <CheckCircle2 className="h-3 w-3" /> Đang sử dụng
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Provider Selection Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                1. Chọn Nhà cung cấp AI (AI Provider):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AI_PROVIDERS.map((p) => {
                  const isSelected = settings.provider === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleProviderChange(p.id)}
                      className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-500 bg-blue-950/40 ring-2 ring-blue-500/50 shadow-lg'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-lg">{p.icon}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${p.badgeColor}`}>
                            {p.badge}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white">{p.name}</h4>
                        <p className="text-[10px] text-slate-400 leading-tight mt-1">
                          {p.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-400 mt-2 pt-1 border-t border-blue-900/50">
                          <CheckCircle2 className="h-3 w-3" /> Đang chọn
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* API Key & Model Configuration */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3.5">
              {/* API Key Box */}
              {!settings.useSharedAdminApi ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-amber-400" />
                      <span>API Key {currentProviderConfig.name} *</span>
                    </label>
                    <a
                      href={currentProviderConfig.keyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
                    >
                      <span>{currentProviderConfig.keyGuide}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value.trim())}
                      placeholder={
                        settings.hasApiKey
                          ? `Đã lưu trên Server (${settings.maskedApiKey}) • Nhập key mới để thay đổi`
                          : currentProviderConfig.keyPlaceholder
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 pr-10 text-xs font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                      title={showApiKey ? 'Ẩn API Key' : 'Hiện API Key'}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {settings.hasApiKey && !apiKeyInput && (
                    <p className="text-[10px] text-emerald-400/90 font-medium mt-1 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>API Key cá nhân đã được lưu an toàn trên Server ({settings.maskedApiKey}).</span>
                    </p>
                  )}

                  <div className="mt-1">
                    <p className="text-[10px] text-slate-400">
                      💡 Nhập API Key do bạn sở hữu. Bạn có thể sử dụng trực tiếp hoặc kết hợp với Endpoint Tùy chỉnh (Proxy / AI Gateway).
                    </p>
                  </div>
                </div>
              ) : (
                /* When Using Shared Admin API */
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Đang sử dụng API do Super Admin (Thầy Công) chia sẻ</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                    Khóa API được quản lý tập trung và thực thi an toàn trên Server. Bạn có toàn quyền sử dụng tất cả tính năng giải đề, phân tích thuật toán và sinh lời giải tự động.
                  </p>
                </div>
              )}

              {/* Model Selector & Custom Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <Cpu className="h-3.5 w-3.5 text-blue-400" />
                      <span>Mô hình AI (Model)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Chọn hoặc gõ trực tiếp</span>
                  </div>
                  <select
                    value={
                      currentProviderConfig.models.some((m) => m.id === settings.model)
                        ? settings.model
                        : 'custom'
                    }
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setSettings({ ...settings, model: e.target.value });
                      }
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-white focus:border-blue-500 focus:outline-none mb-1.5"
                  >
                    {currentProviderConfig.models.map((m) => (
                      <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                        {m.name}
                      </option>
                    ))}
                    {!currentProviderConfig.models.some((m) => m.id === settings.model) && (
                      <option value="custom" className="bg-slate-900 text-amber-300 font-bold">
                        ✏️ Tùy chỉnh: {settings.model}
                      </option>
                    )}
                  </select>
                  <input
                    type="text"
                    value={settings.model}
                    onChange={(e) => setSettings({ ...settings, model: e.target.value.trim() })}
                    placeholder="Nhập mã model (vd: gemini-3.7-flash / gpt-4o-mini)"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-mono text-indigo-300 placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    <span>Endpoint Tùy chỉnh (Tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    value={settings.baseUrl || ''}
                    onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                    placeholder="Mặc định của nhà cung cấp"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Dành cho Proxy hoặc Máy chủ nội bộ
                  </span>
                </div>
              </div>

              {/* Auto Explain Toggle */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Tự động sinh Lời giải chi tiết</span>
                  <span className="text-[11px] text-slate-400 block">
                    Khi AI giải đề, tự động tạo hướng dẫn giải phân tích mã nguồn và thuật toán
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoExplain}
                  onChange={(e) => setSettings({ ...settings, autoExplain: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-fadeIn ${
              testResult.success
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-red-950/60 border-red-800 text-red-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>✓ Đã lưu cài đặt AI và bảo mật thành công!</span>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          {activeTab === 'config' ? (
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Zap className={`h-3.5 w-3.5 text-amber-400 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Đang kiểm tra...' : '⚡ Kiểm tra kết nối'}</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400">
              Đã cấp quyền cho {grantedCount}/{teachersList.length} giáo viên
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-all"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span>{isSaving ? 'Đang lưu...' : 'Lưu Cấu Hình'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
