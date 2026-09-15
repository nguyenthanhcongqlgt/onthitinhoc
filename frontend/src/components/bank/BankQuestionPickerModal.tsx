import React, { useState, useEffect } from 'react';
import { BankQuestion, QuestionCategory } from '../../types';
import { bankApi } from '../../services/api';
import { X, Layers, PlusCircle, CheckCircle, Search } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (selectedQuestions: BankQuestion[]) => void;
}

export const BankQuestionPickerModal: React.FC<Props> = ({ isOpen, onClose, onImport }) => {
  if (!isOpen) return null;

  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<number | 'ALL'>('ALL');

  useEffect(() => {
    if (isOpen) {
      loadData();
      setSelectedIds([]);
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [cats, qs] = await Promise.all([
        bankApi.getCategories(),
        bankApi.getQuestions()
      ]);
      setCategories(cats);
      setQuestions(qs);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleImportClick = () => {
    if (selectedIds.length === 0) return;
    const selectedQs = questions.filter(q => selectedIds.includes(q.id as number));
    onImport(selectedQs);
    onClose();
  };

  const filtered = questions.filter(q => {
    if (catFilter !== 'ALL' && q.category !== catFilter) return false;
    if (search && !q.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-4xl h-[80vh] flex flex-col rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Lấy Câu Hỏi Từ Ngân Hàng</h3>
              <p className="text-xs text-slate-400">Chọn các câu hỏi dưới đây để sao chép vào Đề thi hiện tại</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 p-4 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <select 
            value={catFilter} 
            onChange={e => setCatFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">Tất cả chuyên đề</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm nội dung câu hỏi..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center text-slate-500 py-10 text-sm">Không tìm thấy câu hỏi phù hợp.</div>
          ) : (
            filtered.map(q => {
              const isSelected = selectedIds.includes(q.id as number);
              return (
                <div 
                  key={q.id} 
                  onClick={() => toggleSelect(q.id as number)}
                  className={`flex gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="pt-1">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-600'}`}>
                      {isSelected && <CheckCircle size={14} />}
                    </div>
                  </div>
                  <div className="flex-1 text-sm text-slate-200">
                    <div className="flex gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {q.part_type === 'PART_I' ? 'Phần I' : 'Phần II'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">{q.difficulty_level}</span>
                    </div>
                    <p className="line-clamp-2">{q.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/80 shrink-0">
          <div className="text-sm font-semibold text-indigo-400">
            Đã chọn {selectedIds.length} câu hỏi
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
              Đóng
            </button>
            <button 
              onClick={handleImportClick}
              disabled={selectedIds.length === 0}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Thêm Vào Đề Thi</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
