import { CodeViewer } from '../components/exam/CodeViewer';
import { MathFormula } from '../components/exam/MathFormula';
import React, { useState, useEffect } from 'react';
import { bankApi } from '../services/api';
import { BankQuestion, QuestionCategory } from '../types';
import { Layers, Plus, Search, Edit3, Trash2, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { CreateBankQuestionModal } from '../components/bank/CreateBankQuestionModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { PaginationBar } from '../components/common/PaginationBar';

export const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [competencyFilter, setCompetencyFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Modals
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<BankQuestion | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<any>({ isOpen: false });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qData, cData] = await Promise.all([
        bankApi.getQuestions(),
        bankApi.getCategories()
      ]);
      setQuestions(qData);
      setCategories(cData);
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu ngân hàng câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredQuestions = questions.filter(q => {
    if (competencyFilter !== 'ALL' && q.competency_category !== competencyFilter) return false;
    if (difficultyFilter !== 'ALL' && q.difficulty_level !== difficultyFilter) return false;
    if (search && !q.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const paginatedQuestions = filteredQuestions.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);

  const handleDelete = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa câu hỏi',
      message: 'Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng?',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await bankApi.deleteQuestion(id);
          toast.success('Xóa thành công');
          fetchData();
          setConfirmConfig({ isOpen: false });
        } catch (err) {
          toast.error('Xóa thất bại');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
          <Link to="/teacher" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="text-indigo-400" /> Ngân hàng câu hỏi
            </h1>
            <p className="text-sm text-slate-400">Quản lý các câu hỏi trắc nghiệm và đúng/sai trong kho</p>
          </div>
          <button 
            onClick={() => { setQuestionToEdit(null); setShowQuestionModal(true); }}
            className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus size={18} /> Thêm câu hỏi
          </button>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-2.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Tìm nội dung câu hỏi..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
            />
          </div>
          <select 
            value={competencyFilter} 
            onChange={e => setCompetencyFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
          >
            <option value="ALL">Tất cả Năng lực</option>
            <option value="PROG_BASIC">Lập trình cơ bản</option>
            <option value="ALGO_DS">Thuật toán & CTDL</option>
            <option value="OPTIMIZATION">Tối ưu hóa</option>
            <option value="DB_NETWORK">CSDL & Mạng</option>
            <option value="ICT_APP">Ứng dụng CNTT</option>
          </select>
          <select 
            value={difficultyFilter} 
            onChange={e => setDifficultyFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
          >
            <option value="ALL">Tất cả Mức độ</option>
            <option value="NB">Nhận biết</option>
            <option value="TH">Thông hiểu</option>
            <option value="VD">Vận dụng</option>
            <option value="VDC">Vận dụng cao</option>
          </select>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-400 animate-pulse">Đang tải dữ liệu...</div>
        ) : (
          <div className="space-y-4">
            {paginatedQuestions.length === 0 ? (
              <div className="text-center py-10 text-slate-500 border border-dashed border-slate-700 rounded-2xl bg-slate-900/50">Không có câu hỏi nào phù hợp.</div>
            ) : (
              paginatedQuestions.map(q => (
                <div key={q.id} className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5 hover:border-indigo-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-700 text-slate-300 border border-slate-600">
                        {q.part_type === 'PART_I' ? 'Phần I' : 'Phần II'}
                      </span>
                      <span className="px-2 py-1 text-[10px] font-bold rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {q.competency_category}
                      </span>
                      <span className="px-2 py-1 text-[10px] font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Mức độ: {q.difficulty_level}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setQuestionToEdit(q); setShowQuestionModal(true); }} className="text-slate-400 hover:text-indigo-400 p-1 transition-colors">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDelete(q.id as number)} className="text-slate-400 hover:text-red-400 p-1 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-slate-200 mb-3 whitespace-pre-wrap"><MathFormula text={q.content || ""} /></div>
                  {q.code_snippet && (
                    <div className="mb-3">
                      <CodeViewer code={q.code_snippet} language={q.code_language || 'python'} />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {q.options?.map(opt => (
                      <span key={opt.id} className={`text-xs px-2 py-1.5 rounded-lg border ${opt.is_correct ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-900/80 text-slate-400 border-slate-700'}`}>
                        <span className="font-bold mr-1">{opt.label}.</span> <span className="inline-block"><MathFormula text={opt.content || ""} /></span>
                        {opt.code_snippet && (
                          <div className="mt-2 text-left">
                            <CodeViewer code={opt.code_snippet} language={q.code_language || 'python'} />
                          </div>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
            
            {totalPages > 1 && (
              <PaginationBar 
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredQuestions.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setPage}
                label="câu hỏi"
              />
            )}
          </div>
        )}
      </div>

      <CreateBankQuestionModal 
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        onSuccess={() => { setShowQuestionModal(false); fetchData(); }}
        categories={categories}
        questionToEdit={questionToEdit}
      />
      
      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isDestructive={confirmConfig.isDestructive}
        onCancel={() => setConfirmConfig({ isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
};
