import React from 'react';
import { Users, Layers, Trash2 } from 'lucide-react';
import { ExamSitting } from '../../types';
import { sittingsApi } from '../../services/api';
import { toast } from 'sonner';

interface SittingsTabProps {
  sittings: ExamSitting[];
  setIsCreateSittingModalOpen: (isOpen: boolean) => void;
  setSittingToEdit: (sitting: ExamSitting | null) => void;
  setSelectedSittingForResults: (sitting: ExamSitting | null) => void;
  fetchData: () => void;
  setConfirmConfig: (config: any) => void;
  handleDeleteSitting: (sittingId: number, sittingName: string) => void;
}

export const SittingsTab: React.FC<SittingsTabProps> = ({
  sittings,
  setIsCreateSittingModalOpen,
  setSittingToEdit,
  setSelectedSittingForResults,
  fetchData,
  setConfirmConfig,
  handleDeleteSitting,
}) => {
  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-purple-400" />
          <div>
            <h3 className="text-xl font-bold text-white uppercase">Quản lý Ca Thi (Tổ chức thi tập trung)</h3>
            <p className="text-xs text-slate-400 mt-1">Gom nhiều đề thi thành một phòng thi, hỗ trợ phát đề ngẫu nhiên hoặc xoay vòng.</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateSittingModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:from-purple-500 hover:to-indigo-500 transition-all"
        >
          <span className="font-bold text-lg leading-none mb-0.5">+</span> Tạo Ca Thi Mới
        </button>
      </div>

      {sittings.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-12 text-center text-sm text-slate-500">
          <Users className="h-12 w-12 text-slate-700 mx-auto mb-4" />
          Chưa có Ca thi nào. Hãy tạo Ca thi để tổ chức thi tự động phát nhiều mã đề!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sittings.map(sitting => (
            <div key={sitting.id} className="rounded-2xl border border-slate-800 bg-slate-950 flex flex-col hover:border-slate-700 transition-all">
              <div className="p-5 border-b border-slate-800">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${sitting.is_active ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' : 'bg-amber-950/50 text-amber-400 border border-amber-800/50'}`}>
                    {sitting.is_active ? 'ĐANG MỞ' : 'BẢN NHÁP'}
                  </span>
                  <span className="font-mono bg-purple-500/20 text-purple-300 px-2 py-1 rounded font-bold text-[11px] border border-purple-500/30">
                    MÃ: {sitting.room_code}
                  </span>
                </div>
                <h4 className="font-bold text-white text-base mb-1">{sitting.name}</h4>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">{sitting.description || 'Không có mô tả'}</p>
                
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-400" />
                    <div><div className="text-[10px] text-slate-500 uppercase">Số đề thi</div><div className="text-xs font-bold text-slate-300">{sitting.exams_count} đề</div></div>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <div><div className="text-[10px] text-slate-500 uppercase">HS đã phân</div><div className="text-xs font-bold text-slate-300">{sitting.total_students} HS</div></div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-slate-900/30 flex items-center gap-2 justify-end rounded-b-2xl">
                <button 
                  onClick={async () => {
                    if (sitting.is_active) {
                      setConfirmConfig({
                        isOpen: true,
                        title: 'Xác nhận thu hồi',
                        message: 'Thu hồi ca thi này? Học sinh sẽ không thể vào thi nữa.',
                        onConfirm: async () => {
                          try {
                            await sittingsApi.deactivate(sitting.id);
                            fetchData();
                          } catch (e) {
                            toast.error('Lỗi');
                          }
                        }
                      });
                    } else {
                      try {
                        await sittingsApi.activate(sitting.id);
                        fetchData();
                      } catch (e) {
                        toast.error('Lỗi');
                      }
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${sitting.is_active ? 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white' : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30'}`}
                >
                  {sitting.is_active ? 'Thu hồi' : 'Kích hoạt'}
                </button>
                <button 
                  onClick={() => {
                    setSittingToEdit(sitting);
                    setIsCreateSittingModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30 text-xs font-bold transition-all"
                >
                  Sửa
                </button>
                <button 
                  onClick={() => setSelectedSittingForResults(sitting)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-bold transition-all"
                >
                  Bảng Điểm
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSitting(sitting.id, sitting.name)}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-500 hover:text-red-400 hover:border-red-800 transition-all"
                  title="Xóa ca thi này"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
