import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { Search, Home, FileText, Settings, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './CommandPalette.css'; // We will just use standard tailwind classes, no need for css. But cmdk requires some base styles.

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <Command label="Global Command Menu" shouldFilter={true}>
          <div className="flex items-center border-b border-slate-800 px-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <Command.Input 
              autoFocus 
              placeholder="Nhập lệnh hoặc tìm kiếm..." 
              className="flex-1 bg-transparent text-slate-200 px-3 py-4 outline-none placeholder:text-slate-500 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setOpen(false);
                }
              }}
            />
          </div>
          
          <Command.List className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
            <Command.Empty className="py-6 text-center text-sm text-slate-500">Không tìm thấy kết quả nào.</Command.Empty>

            <Command.Group heading="Điều hướng" className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Command.Item 
                onSelect={() => { setOpen(false); navigate('/'); }}
                className="flex items-center gap-2 px-3 py-2.5 mt-1 rounded-xl cursor-pointer hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <Home className="w-4 h-4" /> Trang chủ
              </Command.Item>
              
              {user?.role === 'TEACHER' || user?.role === 'ADMIN' ? (
                <Command.Item 
                  onSelect={() => { setOpen(false); navigate('/teacher'); }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  <FileText className="w-4 h-4" /> Bảng điều khiển Giáo viên
                </Command.Item>
              ) : (
                <Command.Item 
                  onSelect={() => { setOpen(false); navigate('/student'); }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  <FileText className="w-4 h-4" /> Bảng điều khiển Học sinh
                </Command.Item>
              )}
            </Command.Group>

            <Command.Group heading="Cá nhân" className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
              <Command.Item 
                onSelect={() => { setOpen(false); navigate('/profile'); }}
                className="flex items-center gap-2 px-3 py-2.5 mt-1 rounded-xl cursor-pointer hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <User className="w-4 h-4" /> Thông tin cá nhân
              </Command.Item>
              <Command.Item 
                onSelect={() => { setOpen(false); navigate('/settings'); }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" /> Cài đặt hệ thống
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
      <div className="absolute inset-0 z-[-1]" onClick={() => setOpen(false)}></div>
    </div>
  );
};
