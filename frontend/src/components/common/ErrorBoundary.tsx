import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-300">
          <div className="bg-slate-800/80 p-8 rounded-3xl border border-red-500/30 max-w-lg w-full shadow-2xl text-center space-y-5 backdrop-blur-sm">
            <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertTriangle size={40} />
            </div>
            
            <h1 className="text-2xl font-bold text-white">Đã xảy ra lỗi nghiêm trọng</h1>
            
            <div className="bg-slate-950 p-4 rounded-xl text-left overflow-x-auto text-sm text-red-400 font-mono border border-slate-800">
              {this.state.error?.message || 'Lỗi không xác định trong quá trình kết xuất giao diện.'}
            </div>
            
            <p className="text-slate-400 text-sm">
              Ứng dụng đã chặn đứng lỗi này để tránh làm treo trình duyệt. 
              Bạn có thể tải lại trang để khôi phục trạng thái ban đầu.
            </p>
            
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Tải Lại Trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
