import React from 'react';

interface ExamWatermarkProps {
  studentName: string;
  studentId: string;
  sessionId: number;
}

export const ExamWatermark: React.FC<ExamWatermarkProps> = ({
  studentName,
  studentId,
  sessionId,
}) => {
  const text = `${studentName} • SBD: ${studentId || 'HSG-QL'} • Session #${sessionId}`;

  // Generate repeating patterns
  const rows = Array.from({ length: 8 });
  const cols = Array.from({ length: 4 });

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden select-none opacity-[0.035] dark:opacity-[0.045]">
      <div className="w-full h-full flex flex-col justify-around rotate-[-25deg] scale-125">
        {rows.map((_, rIdx) => (
          <div key={rIdx} className="flex justify-around whitespace-nowrap text-xs font-mono font-bold tracking-widest text-slate-900 dark:text-white">
            {cols.map((_, cIdx) => (
              <span key={cIdx} className="mx-8">
                {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
