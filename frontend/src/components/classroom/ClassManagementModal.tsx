import React, { useState, useEffect } from 'react';
import { ClassRoom, ClassRoomDetail, User } from '../../types';
import { classApi } from '../../services/api';
import {
  X,
  Users,
  UserPlus,
  Trash2,
  Copy,
  Check,
  Search,
  AlertCircle,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface ClassManagementModalProps {
  classRoom: ClassRoom;
  isOpen: boolean;
  onClose: () => void;
  onClassUpdated: () => void;
}

export const ClassManagementModal: React.FC<ClassManagementModalProps> = ({
  classRoom,
  isOpen,
  onClose,
  onClassUpdated,
}) => {
  const [classDetail, setClassDetail] = useState<ClassRoomDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add Students Sub-modal / section
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const data = await classApi.getClassDetail(classRoom.id);
      setClassDetail(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Không thể tải thông tin chi tiết lớp học.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDetail();
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, classRoom.id]);

  const handleCopyCode = () => {
    if (!classRoom.code) return;
    navigator.clipboard.writeText(classRoom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleOpenAddStudents = async () => {
    setShowAddStudentModal(true);
    setSelectedStudentIds([]);
    setIsLoadingAvailable(true);
    try {
      const students = await classApi.getAvailableStudents();
      setAvailableStudents(students);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  const handleSearchAvailable = async (query: string) => {
    setSearchStudentQuery(query);
    setIsLoadingAvailable(true);
    try {
      const students = await classApi.getAvailableStudents(query);
      setAvailableStudents(students);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  const toggleSelectStudent = (id: number) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((sId) => sId !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleAddStudentsSubmit = async () => {
    if (selectedStudentIds.length === 0) return;
    setIsSubmittingAdd(true);
    try {
      const res = await classApi.addStudents(classRoom.id, selectedStudentIds);
      setSuccessMsg(res.detail || 'Thêm học sinh thành công.');
      setShowAddStudentModal(false);
      fetchDetail();
      onClassUpdated();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Lỗi khi thêm học sinh.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleRemoveStudent = async (student: User) => {
    if (!window.confirm(`Bạn có chắc muốn xóa học sinh "${student.full_name || student.username}" khỏi lớp này không?`)) {
      return;
    }
    try {
      await classApi.removeStudent(classRoom.id, student.id);
      setSuccessMsg(`Đã xóa ${student.full_name || student.username} khỏi lớp.`);
      fetchDetail();
      onClassUpdated();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Không thể xóa học sinh khỏi lớp.');
    }
  };

  if (!isOpen) return null;

  // Filter existing students in class if user searches in table
  const [filterInClass, setFilterInClass] = useState('');
  const enrolledStudents = (classDetail?.students || []).filter((s) => {
    if (!filterInClass.trim()) return true;
    const q = filterInClass.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q) ||
      s.student_id?.toLowerCase().includes(q)
    );
  });

  // Filter out students that are already in this class when adding
  const currentEnrolledIds = new Set((classDetail?.students || []).map((s) => s.id));
  const candidateStudents = availableStudents.filter((s) => !currentEnrolledIds.has(s.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Users size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">{classRoom.name}</h3>
                <span className="rounded-md bg-blue-950 border border-blue-800/60 px-2 py-0.5 text-[11px] font-semibold text-blue-300">
                  {classRoom.grade_display || `Khối ${classRoom.grade}`}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Năm học: {classRoom.school_year} • Sĩ số: <span className="text-emerald-400 font-bold">{classDetail?.students_count ?? classRoom.students_count}</span> học sinh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Class Code Badge */}
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
              <span>Mã lớp:</span>
              <span className="font-mono font-bold tracking-wider text-white">{classRoom.code}</span>
              <button
                onClick={handleCopyCode}
                title="Sao chép mã lớp"
                className="ml-1 text-amber-400 hover:text-white transition-colors"
              >
                {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <Check size={16} className="shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Bar: Search in class + Add student button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={filterInClass}
                onChange={(e) => setFilterInClass(e.target.value)}
                placeholder="Tìm học sinh trong lớp..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            </div>

            <button
              onClick={handleOpenAddStudents}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition-all"
            >
              <UserPlus size={15} />
              <span>Thêm Học Sinh Vào Lớp</span>
            </button>
          </div>

          {/* Students Table */}
          {isLoading ? (
            <div className="py-16 text-center text-slate-500 text-sm">Đang tải danh sách học sinh...</div>
          ) : enrolledStudents.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-12 text-center text-slate-400 space-y-2">
              <GraduationCap className="mx-auto h-8 w-8 text-slate-600" />
              <p className="font-semibold text-slate-300">
                {filterInClass ? 'Không tìm thấy học sinh nào phù hợp.' : 'Chưa có học sinh nào trong lớp học này.'}
              </p>
              <p className="text-xs text-slate-500">
                Thầy/Cô có thể bấm "Thêm Học Sinh Vào Lớp" hoặc gửi Mã lớp <span className="font-mono font-bold text-amber-400">{classRoom.code}</span> cho học sinh tự tham gia.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">STT</th>
                    <th className="px-4 py-3">Họ và Tên</th>
                    <th className="px-4 py-3">Tên đăng nhập</th>
                    <th className="px-4 py-3">Số Báo Danh</th>
                    <th className="px-4 py-3">Lớp đăng ký</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {enrolledStudents.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {student.full_name || student.username}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">{student.username}</td>
                      <td className="px-4 py-3 font-mono text-amber-400 font-semibold">
                        {student.student_id || 'Chưa có'}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{student.class_name || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemoveStudent(student)}
                          title="Xóa khỏi lớp học này"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-4 flex justify-between items-center bg-slate-950/50">
          <p className="text-xs text-slate-500">
            {classRoom.description || 'Chưa có mô tả lớp học'}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Sub-Modal: Add Students to Class */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 p-4">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-400" />
                <h4 className="text-sm sm:text-base font-bold text-white">
                  Thêm Học Sinh Vào Lớp: {classRoom.name}
                </h4>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              {/* Search bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchStudentQuery}
                  onChange={(e) => handleSearchAvailable(e.target.value)}
                  placeholder="Tìm kiếm theo Tên, Số báo danh, Tên đăng nhập..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
              </div>

              {/* Candidates list */}
              {isLoadingAvailable ? (
                <div className="py-12 text-center text-slate-500 text-xs">Đang tìm học sinh...</div>
              ) : candidateStudents.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Không tìm thấy học sinh mới nào để thêm vào lớp.
                </div>
              ) : (
                <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                  {candidateStudents.map((s) => {
                    const isSelected = selectedStudentIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleSelectStudent(s.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-600/10 text-white'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent div
                            className="rounded border-slate-700 text-blue-600 focus:ring-0"
                          />
                          <div>
                            <div className="font-semibold text-xs text-white">
                              {s.full_name || s.username}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              @{s.username} • SBD: {s.student_id || 'Chưa cấp'} • Lớp: {s.class_name || 'Chưa rõ'}
                            </div>
                          </div>
                        </div>

                        <span className="text-[11px] font-semibold text-blue-400">
                          {isSelected ? 'Đã chọn' : '+ Chọn'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 px-6 py-4 flex justify-between items-center bg-slate-950">
              <span className="text-xs text-slate-400">
                Đã chọn: <strong className="text-white">{selectedStudentIds.length}</strong> học sinh
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddStudentsSubmit}
                  disabled={selectedStudentIds.length === 0 || isSubmittingAdd}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-bold text-white shadow-md transition-all"
                >
                  <UserPlus size={14} />
                  <span>{isSubmittingAdd ? 'Đang thêm...' : `Thêm (${selectedStudentIds.length})`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
