import React, { useState, useEffect } from 'react';
import { bankApi, examsApi } from '../services/api';
import { Settings, CheckCircle, ChevronLeft, Layers, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { QuestionCategory } from '../types';

interface MatrixCell {
  quantity: number;
  available: number | null;
}

interface MatrixRowData {
  categoryId: number;
  categoryName: string;
  nb_trac_nghiem: MatrixCell;
  th_trac_nghiem: MatrixCell;
  vd_trac_nghiem: MatrixCell;
  vdc_trac_nghiem: MatrixCell;
  nb_dung_sai: MatrixCell;
  th_dung_sai: MatrixCell;
  vd_dung_sai: MatrixCell;
  vdc_dung_sai: MatrixCell;
}

export type MatrixField = 'nb_trac_nghiem' | 'th_trac_nghiem' | 'vd_trac_nghiem' | 'vdc_trac_nghiem' | 'nb_dung_sai' | 'th_dung_sai' | 'vd_dung_sai' | 'vdc_dung_sai';

export const AutoExamGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());
  
  const [testName, setTestName] = useState('');
  const [totalTime, setTotalTime] = useState(45);
  const [totalScore, setTotalScore] = useState(10);
  
  const [matrixData, setMatrixData] = useState<Record<number, MatrixRowData>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await bankApi.getCategories();
        setCategories(data);
      } catch (err) {
        toast.error('Lỗi khi tải danh sách chủ đề');
      }
    };
    fetchCats();
  }, []);

  const handleToggleCategory = (cat: QuestionCategory) => {
    const newSet = new Set(selectedCategoryIds);
    if (newSet.has(cat.id)) {
      newSet.delete(cat.id);
      const newData = { ...matrixData };
      delete newData[cat.id];
      setMatrixData(newData);
    } else {
      newSet.add(cat.id);
      setMatrixData({
        ...matrixData,
        [cat.id]: {
          categoryId: cat.id,
          categoryName: cat.name,
          nb_trac_nghiem: { quantity: 0, available: null },
          th_trac_nghiem: { quantity: 0, available: null },
          vd_trac_nghiem: { quantity: 0, available: null },
          vdc_trac_nghiem: { quantity: 0, available: null },
          nb_dung_sai: { quantity: 0, available: null },
          th_dung_sai: { quantity: 0, available: null },
          vd_dung_sai: { quantity: 0, available: null },
          vdc_dung_sai: { quantity: 0, available: null },
        }
      });
    }
    setSelectedCategoryIds(newSet);
  };

  const handleCellChange = (catId: number, field: MatrixField, value: string) => {
    const num = parseInt(value) || 0;
    setMatrixData(prev => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        [field]: { ...(prev[catId][field] as MatrixCell), quantity: num }
      }
    }));
  };

  const getMatrixRules = () => {
    const rules: any[] = [];
    Object.values(matrixData).forEach(row => {
      const mappings = [
        { field: 'nb_trac_nghiem', diff: 'NB', type: 'trac-nghiem' },
        { field: 'th_trac_nghiem', diff: 'TH', type: 'trac-nghiem' },
        { field: 'vd_trac_nghiem', diff: 'VD', type: 'trac-nghiem' },
        { field: 'vdc_trac_nghiem', diff: 'VDC', type: 'trac-nghiem' },
        { field: 'nb_dung_sai', diff: 'NB', type: 'dung-sai' },
        { field: 'th_dung_sai', diff: 'TH', type: 'dung-sai' },
        { field: 'vd_dung_sai', diff: 'VD', type: 'dung-sai' },
        { field: 'vdc_dung_sai', diff: 'VDC', type: 'dung-sai' },
      ];
      mappings.forEach(m => {
        const cell = row[m.field as MatrixField];
        if (cell.quantity > 0) {
          rules.push({
            knowledge_unit_id: row.categoryId,
            knowledge_unit_name: row.categoryName,
            cognitive_level: m.diff,
            question_type: m.type,
            quantity: cell.quantity
          });
        }
      });
    });
    return rules;
  };

  const validateMatrix = async () => {
    const rules = getMatrixRules();
    if (rules.length === 0) return;
    
    setIsValidating(true);
    try {
      const res = await examsApi.matrixValidate({ matrix_rules: rules });
      if (res.success && res.results) {
        const newData = { ...matrixData };
        res.results.forEach((r: any) => {
          const rule = r.rule;
          const fieldBase = rule.cognitive_level.toLowerCase();
          const typeBase = rule.question_type === 'dung-sai' ? 'dung_sai' : 'trac_nghiem';
          const field = `${fieldBase}_${typeBase}` as MatrixField;
          if (newData[rule.knowledge_unit_id]) {
            newData[rule.knowledge_unit_id][field] = {
              ...(newData[rule.knowledge_unit_id][field]),
              available: r.available_count
            };
          }
        });
        setMatrixData(newData);
      }
    } catch (err) {
      toast.error('Lỗi khi kiểm tra số lượng câu hỏi.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!testName.trim()) {
      toast.error('Vui lòng nhập tên ma trận / tên đề');
      return;
    }
    const rules = getMatrixRules();
    if (rules.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 câu hỏi trong bảng ma trận');
      return;
    }

    try {
      setIsGenerating(true);
      const res = await examsApi.matrixGenerate({
        test_config: {
          name: testName,
          total_time_minutes: totalTime,
          total_score: totalScore
        },
        matrix_rules: rules
      });
      if (res.success) {
        toast.success(res.message);
        navigate(`/teacher?tab=exams`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.errors?.join(', ') || 'Lỗi khi tạo đề thi.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
        
        {/* Cột trái: Danh sách Chủ đề */}
        <div className="w-full md:w-1/4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Link to="/teacher" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300">
              <ChevronLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="text-emerald-400" /> Tạo Đề Từ Ma Trận
            </h1>
          </div>
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 flex-1">
            <h3 className="font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Layers size={18} /> Đơn vị kiến thức
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {categories.map(cat => (
                <label key={cat.id} className="flex items-start gap-3 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    className="mt-1 w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500/20 bg-slate-900"
                    checked={selectedCategoryIds.has(cat.id)}
                    onChange={() => handleToggleCategory(cat)}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-200">{cat.name}</span>
                  </div>
                </label>
              ))}
              {categories.length === 0 && <div className="text-slate-500 text-sm">Chưa có chủ đề nào trong ngân hàng.</div>}
            </div>
          </div>
        </div>

        {/* Cột giữa: Lưới ma trận */}
        <div className="w-full md:w-2/4 flex flex-col gap-4">
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 overflow-x-auto flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-300">Bảng Ma Trận</h3>
              <button onClick={validateMatrix} disabled={isValidating} className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                {isValidating ? 'Đang kiểm tra...' : 'Kiểm tra kho đạn'}
              </button>
            </div>
            
            {selectedCategoryIds.size === 0 ? (
              <div className="h-40 flex items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-xl">
                Vui lòng chọn Chủ đề / Bài học ở cột bên trái
              </div>
            ) : (
              <table className="w-full text-sm text-left border-collapse min-w-[600px]">
                <thead>
                  <tr>
                    <th className="p-3 border-b border-slate-700 text-slate-400 font-semibold w-1/3">Chương/Chủ đề/Bài học</th>
                    <th className="p-3 border-b border-slate-700 text-slate-400 font-semibold text-center">Nhận biết</th>
                    <th className="p-3 border-b border-slate-700 text-slate-400 font-semibold text-center">Thông hiểu</th>
                    <th className="p-3 border-b border-slate-700 text-slate-400 font-semibold text-center">Vận dụng</th>
                    <th className="p-3 border-b border-slate-700 text-slate-400 font-semibold text-center">VD Cao</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(matrixData).map(row => (
                    <React.Fragment key={row.categoryId}>
                      {/* Dòng Tiêu đề bài */}
                      <tr className="bg-slate-800/60">
                        <td colSpan={5} className="p-3 font-semibold text-emerald-400">{row.categoryName}</td>
                      </tr>
                      {/* Dòng Trắc nghiệm */}
                      <tr className="border-b border-slate-700/50 hover:bg-slate-800/30">
                        <td className="p-3 pl-8 text-slate-300 text-xs">↳ Trắc nghiệm</td>
                        {['nb', 'th', 'vd', 'vdc'].map(diff => {
                          const field = `${diff}_trac_nghiem` as MatrixField;
                          const cell = row[field] as MatrixCell;
                          const isError = cell.available !== null && cell.available < cell.quantity;
                          return (
                            <td key={diff} className="p-2 text-center">
                              <input 
                                type="number" min={0} 
                                value={cell.quantity || ''}
                                onChange={e => handleCellChange(row.categoryId, field, e.target.value)}
                                className={`w-12 bg-slate-900 border ${isError ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-emerald-500'} rounded px-1 py-1 text-center outline-none transition-colors`}
                              />
                              {cell.quantity > 0 && cell.available !== null && (
                                <div className={`text-[10px] mt-1 ${isError ? 'text-red-400' : 'text-slate-500'}`}>(Kho: {cell.available})</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      {/* Dòng Đúng Sai */}
                      <tr className="border-b border-slate-700 hover:bg-slate-800/30">
                        <td className="p-3 pl-8 text-slate-300 text-xs">↳ Đúng/Sai</td>
                        {['nb', 'th', 'vd', 'vdc'].map(diff => {
                          const field = `${diff}_dung_sai` as MatrixField;
                          const cell = row[field] as MatrixCell;
                          const isError = cell.available !== null && cell.available < cell.quantity;
                          return (
                            <td key={diff} className="p-2 text-center">
                              <input 
                                type="number" min={0} 
                                value={cell.quantity || ''}
                                onChange={e => handleCellChange(row.categoryId, field, e.target.value)}
                                className={`w-12 bg-slate-900 border ${isError ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-emerald-500'} rounded px-1 py-1 text-center outline-none transition-colors`}
                              />
                              {cell.quantity > 0 && cell.available !== null && (
                                <div className={`text-[10px] mt-1 ${isError ? 'text-red-400' : 'text-slate-500'}`}>(Kho: {cell.available})</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Cột phải: Cấu hình */}
        <div className="w-full md:w-1/4 flex flex-col gap-4">
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 space-y-5">
            <h3 className="font-semibold text-slate-300 pb-2 border-b border-slate-700">Cấu hình Đề thi</h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Tên bộ đề</label>
              <input 
                type="text" 
                value={testName}
                onChange={e => setTestName(e.target.value)}
                placeholder="VD: Đề Tin học cuối kì..." 
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-400 mb-1">T.Gian (Phút)</label>
                <input 
                  type="number" value={totalTime} onChange={e => setTotalTime(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tổng điểm</label>
                <input 
                  type="number" value={totalScore} onChange={e => setTotalScore(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700 space-y-3">
              <button 
                onClick={handleSubmit}
                disabled={isGenerating}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                {isGenerating ? (
                  <><div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Đang tạo...</>
                ) : (
                  <><CheckCircle size={18} /> Tạo Đề Tự Động</>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
