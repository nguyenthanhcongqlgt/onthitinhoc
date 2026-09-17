import React, { useState, useEffect } from 'react';
import { X, Save, Clock, Users, Shield, Copy, CheckCircle2, Search, FileText, Trash2 } from 'lucide-react';
import { ExamInfo, ExamSitting } from '../../types';
import { sittingsApi } from '../../services/api';

interface CreateSittingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  availableExams: ExamInfo[];
  availableClasses: string[];
  sittingToEdit?: ExamSitting | null;
}

export function CreateSittingModal({ isOpen, onClose, onCreated, availableExams, availableClasses, sittingToEdit }: CreateSittingModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [assignedClasses, setAssignedClasses] = useState('Toàn trường');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [distributionMode, setDistributionMode] = useState<'RANDOM' | 'ROUND_ROBIN' | 'MANUAL'>('RANDOM');
  const [showScore, setShowScore] = useState(true);
  const [showExplanation, setShowExplanation] = useState(true);
  const [allowRunCode, setAllowRunCode] = useState(true);
  
  const [selectedExams, setSelectedExams] = useState<number[]>([]);
  const [searchExamQuery, setSearchExamQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (sittingToEdit) {
        setName(sittingToEdit.name);
        setDescription(sittingToEdit.description || '');
        setPassword(sittingToEdit.password || '');
        setAssignedClasses(sittingToEdit.assigned_classes || 'Toàn trường');
        setStartTime(sittingToEdit.start_time ? sittingToEdit.start_time.slice(0, 16) : '');
        setEndTime(sittingToEdit.end_time ? sittingToEdit.end_time.slice(0, 16) : '');
        setMaxAttempts(sittingToEdit.max_attempts);
        setDistributionMode(sittingToEdit.distribution_mode);
        setShowScore(sittingToEdit.show_score_after_test);
        setShowExplanation(sittingToEdit.show_explanation_after_test);
        setAllowRunCode(sittingToEdit.allow_run_code);
        setSelectedExams(sittingToEdit.exams_detail.map(e => e.id));
      } else {
        setName(''); setDescription(''); setPassword(''); setAssignedClasses('Toàn trường');
        setStartTime(''); setEndTime(''); setMaxAttempts(1); setDistributionMode('RANDOM');
        setShowScore(true); setShowExplanation(true); setAllowRunCode(true); setSelectedExams([]); 
      }
      setSearchExamQuery(''); setError('');
    }
  }, [isOpen, sittingToEdit]);

  if (!isOpen) return null;

  const handleToggleExam = (id: number) => {
    setSelectedExams(prev => prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]);
  };

  const handleAddClass = (cls: string) => {
    const current = assignedClasses.split(',').map(c => c.trim()).filter(Boolean);
    if (!current.includes(cls)) {
      if (current.includes('Toàn trường') && cls !== 'Toàn trường') setAssignedClasses(cls);
      else if (cls === 'Toàn trường') setAssignedClasses('Toàn trường');
      else setAssignedClasses([...current, cls].join(', '));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Vui lòng nhập tên ca thi');
    if (selectedExams.length === 0) return setError('Vui lòng chọn ít nhất 1 đề thi');

    try {
      setIsSubmitting(true);
      setError('');
      
      const payload = {
        name, description, password, assigned_classes: assignedClasses,
        start_time: startTime ? new Date(startTime).toISOString() : null,
        end_time: endTime ? new Date(endTime).toISOString() : null,
        max_attempts: maxAttempts, distribution_mode: distributionMode,
        show_score_after_test: showScore, show_explanation_after_test: showExplanation,
        allow_run_code: allowRunCode,
        exam_ids: selectedExams
      };

      if (sittingToEdit) {
        await sittingsApi.update(sittingToEdit.id, payload);
      } else {
        await sittingsApi.create(payload);
      }
      
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!sittingToEdit) return;
    if (!window.confirm(`Thầy/Cô có chắc chắn muốn xóa Ca thi "${sittingToEdit.name}" không?\n\nLưu ý: Các đề thi liên kết vẫn được giữ nguyên an toàn trong Ngân hàng đề, chỉ xóa thiết lập phòng thi và phân bổ của ca này.`)) {
      return;
    }
    try {
      setIsSubmitting(true);
      await sittingsApi.delete(sittingToEdit.id);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Xóa ca thi thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredExams = availableExams.filter(e => e.title.toLowerCase().includes(searchExamQuery.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2"><Users className="h-6 w-6" /> {sittingToEdit ? 'Chỉnh sửa Ca Thi' : 'Tạo Ca Thi Mới'}</h2>
          <button onClick={onClose} className="p-2 text-white/80 hover:bg-white/20 rounded-full" aria-label="Đóng" title="Đóng"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          <form id="createSittingForm" onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex gap-2"><Shield className="h-5 w-5 shrink-0" /><p>{error}</p></div>}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tên Ca Thi *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu vào phòng thi</label>
                  <input type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl outline-none" placeholder="Để trống nếu không cần mật khẩu" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lớp / Đối tượng tham gia</label>
                  <input type="text" value={assignedClasses} onChange={e => setAssignedClasses(e.target.value)} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl outline-none" />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleAddClass('Toàn trường')} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">Toàn trường</button>
                    {availableClasses.map(c => <button key={c} type="button" onClick={() => handleAddClass(c)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200">{c}</button>)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Giờ mở đề</label>
                    <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Hạn chót</label>
                    <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col">
                  <h3 className="font-semibold text-gray-800 mb-2">Chọn Đề Thi ({selectedExams.length})</h3>
                  <input type="text" placeholder="Tìm đề thi..." value={searchExamQuery} onChange={e => setSearchExamQuery(e.target.value)} className="w-full px-3 py-2 mb-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" />
                  <div className="flex-1 overflow-y-auto max-h-48 space-y-2">
                    {filteredExams.map(exam => {
                      const isSelected = selectedExams.includes(exam.id);
                      return (
                        <div key={exam.id} onClick={() => handleToggleExam(exam.id)} className={`p-2 rounded-lg border cursor-pointer flex gap-2 ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                          <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}></div>
                          <div className="text-sm">{exam.title}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">Phương thức phân phát đề</h3>
                  <select value={distributionMode} onChange={e => setDistributionMode(e.target.value as any)} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    <option value="RANDOM">Chia Ngẫu Nhiên</option>
                    <option value="ROUND_ROBIN">Chia Tuần Tự (Xoay vòng)</option>
                    <option value="MANUAL">Tự do Lựa chọn</option>
                  </select>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mt-4">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">Cài đặt khác</h3>
                  <label className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer mb-2">
                    <span className="text-sm text-gray-700">Cho phép học sinh dùng IDE chạy Code</span>
                    <input type="checkbox" checked={allowRunCode} onChange={e => setAllowRunCode(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                    <span className="text-sm text-gray-700">Xem điểm & giải thích sau thi</span>
                    <input type="checkbox" checked={showScore} onChange={e => {setShowScore(e.target.checked); setShowExplanation(e.target.checked);}} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 rounded-b-2xl">
          {sittingToEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              <span>Xóa ca thi</span>
            </button>
          ) : <div />}
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Hủy</button>
            <button form="createSittingForm" type="submit" disabled={isSubmitting || selectedExams.length === 0} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Đang lưu...' : (sittingToEdit ? 'Lưu Thay Đổi' : 'Khởi tạo Ca Thi')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
