import React from 'react';
import { Layers, Plus, Search, Edit3, Trash2 } from 'lucide-react';
import { BankQuestion, QuestionCategory } from '../../types';
import { PaginationBar } from '../common/PaginationBar';
import { bankApi } from '../../services/api';
import { toast } from 'sonner';

interface BankTabProps {
  bankQuestions: BankQuestion[];
  bankCategories: QuestionCategory[];
  bankSearch: string;
  setBankSearch: (val: string) => void;
  selectedBankCategoryId: number | 'ALL';
  setSelectedBankCategoryId: (val: number | 'ALL') => void;
  bankPartFilter: 'ALL' | 'PART_I' | 'PART_II';
  setBankPartFilter: (val: 'ALL' | 'PART_I' | 'PART_II') => void;
  bankBranchFilter: string;
  setBankBranchFilter: (val: string) => void;
  bankDifficultyFilter: string;
  setBankDifficultyFilter: (val: string) => void;
  bankSortBy: string;
  setBankSortBy: (val: string) => void;
  bankPage: number;
  setBankPage: (val: number) => void;
  BANK_PER_PAGE: number;
  setCategoryToEdit: (cat: QuestionCategory | null) => void;
  setShowCategoryModal: (show: boolean) => void;
  setBankQuestionToEdit: (q: BankQuestion | null) => void;
  setShowBankQuestionModal: (show: boolean) => void;
  setConfirmConfig: (config: any) => void;
  fetchData: () => void;
}

export const BankTab: React.FC<BankTabProps> = ({
  bankQuestions,
  bankCategories,
  bankSearch,
  setBankSearch,
  selectedBankCategoryId,
  setSelectedBankCategoryId,
  bankPartFilter,
  setBankPartFilter,
  bankBranchFilter,
  setBankBranchFilter,
  bankDifficultyFilter,
  setBankDifficultyFilter,
  bankSortBy,
  setBankSortBy,
  bankPage,
  setBankPage,
  BANK_PER_PAGE,
  setCategoryToEdit,
  setShowCategoryModal,
  setBankQuestionToEdit,
  setShowBankQuestionModal,
  setConfirmConfig,
  fetchData,
}) => {
  const filteredBankQuestions = bankQuestions.filter((q) => {
    if (selectedBankCategoryId !== 'ALL' && q.category !== selectedBankCategoryId) return false;
    if (bankPartFilter !== 'ALL' && q.part_type !== bankPartFilter) return false;
    if (bankBranchFilter !== 'ALL' && q.branch !== bankBranchFilter) return false;
    if (bankDifficultyFilter !== 'ALL' && q.difficulty_level !== bankDifficultyFilter) return false;
    if (bankSearch.trim()) {
      const query = bankSearch.toLowerCase();
      if (!q.content?.toLowerCase().includes(query)) return false;
    }
    return true;
  }).sort((a, b) => {
    const diffOrder: Record<string, number> = { NB: 1, TH: 2, VD: 3, VDC: 4 };
    switch (bankSortBy) {
      case 'oldest': return (a.id as number) - (b.id as number);
      case 'difficulty_asc': return (diffOrder[a.difficulty_level] || 0) - (diffOrder[b.difficulty_level] || 0);
      case 'difficulty_desc': return (diffOrder[b.difficulty_level] || 0) - (diffOrder[a.difficulty_level] || 0);
      case 'newest':
      default: return (b.id as number) - (a.id as number);
    }
  });

  const totalBankPages = Math.ceil(filteredBankQuestions.length / BANK_PER_PAGE);
  const paginatedBankQuestions = filteredBankQuestions.slice((bankPage - 1) * BANK_PER_PAGE, bankPage * BANK_PER_PAGE);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white">NGÂN HÀNG CÂU HỎI</h3>
          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
            {filteredBankQuestions.length} / {bankQuestions.length} câu
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setCategoryToEdit(null); setShowCategoryModal(true); }}
            className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-bold text-white transition-all border border-slate-700"
          >
            <Plus className="h-4 w-4" /><span>Thêm Chuyên Đề</span>
          </button>
          <button
            onClick={() => { setBankQuestionToEdit(null); setShowBankQuestionModal(true); }}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="h-4 w-4" /><span>Thêm Câu Hỏi Mới</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-5">
        {/* Sidebar: Categories */}
        <div className="w-full md:w-1/4 space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chuyên Đề / Thư Mục</h4>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-2 space-y-1">
            <button
              onClick={() => setSelectedBankCategoryId('ALL')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                selectedBankCategoryId === 'ALL'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:bg-slate-800 border border-transparent'
              }`}
            >
              📂 Tất cả câu hỏi ({bankQuestions.length})
            </button>
            {bankCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedBankCategoryId(cat.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-between group ${
                  selectedBankCategoryId === cat.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800 border border-transparent'
                }`}
              >
                <span>📁 {cat.name}</span>
                <span className="text-xs text-slate-500 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 group-hover:border-slate-700">
                  {cat.question_count || 0}
                </span>
              </button>
            ))}
            {bankCategories.length === 0 && (
              <div className="px-3 py-4 text-xs text-slate-500 text-center italic">Chưa có chuyên đề nào</div>
            )}
          </div>
        </div>

        {/* Main Content: Questions List */}
        <div className="w-full md:w-3/4 space-y-4">
          {/* Search & Filters Bar */}
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  placeholder="Tìm kiếm nội dung câu hỏi..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
              </div>
              <select
                value={bankSortBy}
                onChange={(e) => setBankSortBy(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="difficulty_asc">Độ khó (dễ → khó)</option>
                <option value="difficulty_desc">Độ khó (khó → dễ)</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-bold text-slate-500 uppercase tracking-wider mr-1">Phần:</span>
              {(['ALL', 'PART_I', 'PART_II'] as const).map((val) => (
                <button key={val} onClick={() => setBankPartFilter(val)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${bankPartFilter === val ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >{val === 'ALL' ? 'Tất cả' : val === 'PART_I' ? 'Phần I' : 'Phần II'}</button>
              ))}
              <span className="font-bold text-slate-500 uppercase tracking-wider ml-3 mr-1">Nhánh:</span>
              {['ALL', 'CS', 'ICT', 'COMMON'].map((val) => (
                <button key={val} onClick={() => setBankBranchFilter(val)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${bankBranchFilter === val ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >{val === 'ALL' ? 'Tất cả' : val}</button>
              ))}
              <span className="font-bold text-slate-500 uppercase tracking-wider ml-3 mr-1">Độ khó:</span>
              {['ALL', 'NB', 'TH', 'VD', 'VDC'].map((val) => (
                <button key={val} onClick={() => setBankDifficultyFilter(val)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${bankDifficultyFilter === val ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >{val === 'ALL' ? 'Tất cả' : val}</button>
              ))}
            </div>
          </div>

          {filteredBankQuestions.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-12 text-center text-slate-400 space-y-3">
              <Layers className="mx-auto h-10 w-10 text-slate-600" />
              <p className="font-semibold text-slate-300">{bankQuestions.length === 0 ? 'Ngân hàng chưa có câu hỏi nào.' : 'Không tìm thấy câu hỏi phù hợp với bộ lọc.'}</p>
              <p className="text-xs text-slate-500">{bankQuestions.length === 0 ? 'Hãy thêm câu hỏi mới hoặc tạo từ đề thi có sẵn.' : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'}</p>
            </div>
          ) : (
            <>
            <div className="space-y-3">
              {paginatedBankQuestions.map((q) => (
                <div key={q.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">{q.part_type === 'PART_I' ? 'Phần I' : 'Phần II'}</span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">{q.branch}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        q.difficulty_level === 'NB' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                        q.difficulty_level === 'TH' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                        q.difficulty_level === 'VD' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}>{q.difficulty_level}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setBankQuestionToEdit(q); setShowBankQuestionModal(true); }}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"><Edit3 size={14} /></button>
                      <button onClick={async () => {
                        setConfirmConfig({
                          isOpen: true,
                          title: 'Xác nhận xóa',
                          message: 'Xóa câu hỏi này khỏi thư viện?',
                          isDestructive: true,
                          onConfirm: async () => {
                            try { await bankApi.deleteQuestion(q.id as number); fetchData(); } catch(e) { toast.error('Lỗi'); }
                          }
                        });
                      }} className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-950 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="text-sm text-slate-200 line-clamp-2">{q.content}</div>
                  {q.options && q.options.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {q.options.map(opt => (
                        <span key={opt.id} className={`text-xs font-mono px-1.5 py-0.5 rounded ${opt.is_correct ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'}`}>{opt.label}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-[10px] text-slate-500">
                    Thư mục: <span className="text-slate-400">{q.category_name || '(Không phân loại)'}</span> • Người tạo: {q.created_by_name}
                  </div>
                </div>
              ))}
            </div>
            <PaginationBar
              currentPage={bankPage}
              totalPages={totalBankPages}
              totalItems={filteredBankQuestions.length}
              itemsPerPage={BANK_PER_PAGE}
              onPageChange={setBankPage}
              label="câu hỏi"
            />
            </>
          )}
        </div>
      </div>
    </section>
  );
};
