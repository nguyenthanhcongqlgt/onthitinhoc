import React from 'react';
import { AlertTriangle, ShieldAlert, Maximize } from 'lucide-react';

interface TabSwitchWarningModalProps {
  isOpen: boolean;
  violationCount: number;
  maxViolations: number;
  message: string;
  onAcknowledge: () => void;
}

export const TabSwitchWarningModal: React.FC<TabSwitchWarningModalProps> = ({
  isOpen,
  violationCount,
  maxViolations,
  message,
  onAcknowledge,
}) => {
  if (!isOpen) return null;

  const isCritical = violationCount >= maxViolations;
  const remaining = Math.max(0, maxViolations - violationCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10">
        <div className={`p-6 ${isCritical ? 'bg-red-600 text-white' : 'bg-amber-500 text-slate-950'}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 shadow-inner">
              {isCritical ? (
                <ShieldAlert className="h-7 w-7 text-white" />
              ) : (
                <AlertTriangle className="h-7 w-7 text-slate-950" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {isCritical ? 'BÀI THI ĐÃ BỊ KHÓA!' : 'CẢNH BÁO VI PHẠM THI CỬ'}
              </h2>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isCritical ? 'text-red-100' : 'text-slate-900/80'}`}>
                Hệ thống Giám sát Gian lận THPT Quất Lâm
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700 leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3 text-sm">
            <span className="text-slate-600 font-medium">Số lần vi phạm ghi nhận:</span>
            <span className="font-mono text-base font-bold text-red-600">
              {violationCount} / {maxViolations} lần
            </span>
          </div>

          {isCritical ? (
            <p className="text-xs text-red-600 font-semibold text-center">
              Bạn đã vượt quá số lần chuyển tab / ứng dụng cho phép. Bài thi đã được tự động nộp và ghi nhận vi phạm vào học bạ số.
            </p>
          ) : (
            <p className="text-xs text-slate-500 text-center">
              Còn lại <strong>{remaining}</strong> lần cảnh báo trước khi hệ thống tự động khóa và thu bài của bạn.
            </p>
          )}

          <button
            onClick={onAcknowledge}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 font-semibold text-white shadow-lg transition-all ${
              isCritical
                ? 'bg-slate-800 hover:bg-slate-900'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
            }`}
          >
            <Maximize className="h-4 w-4" />
            {isCritical ? 'Xem Kết Quả Đã Khóa' : 'Tôi Đã Hiểu & Quay Lại Toàn Màn Hình'}
          </button>
        </div>
      </div>
    </div>
  );
};
