import React, { useState, useEffect } from 'react';
import { twoFactorApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  X,
  Copy,
  Check,
  KeyRound,
  Download,
  AlertTriangle,
  Lock,
  ArrowRight
} from 'lucide-react';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, refreshUserProfile } = useAuth();

  const [step, setStep] = useState<'STATUS' | 'SETUP' | 'BACKUP_CODES' | 'DISABLE'>('STATUS');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);
  const [copiedBackup, setCopiedBackup] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setStep('STATUS');
      setError('');
      setVerificationCode('');
      setDisablePassword('');
    }
  }, [isOpen, user?.is_two_factor_enabled]);

  if (!isOpen) return null;

  const handleStartSetup = async () => {
    setError('');
    setIsLoading(true);
    try {
      const res = await twoFactorApi.setup();
      setQrCode(res.qr_code);
      setSecret(res.secret);
      setStep('SETUP');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể khởi tạo mã 2FA. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError('Vui lòng nhập mã 6 chữ số từ ứng dụng.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const res = await twoFactorApi.confirm(verificationCode.trim());
      setBackupCodes(res.backup_codes || []);
      setStep('BACKUP_CODES');
      if (refreshUserProfile) refreshUserProfile();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Mã xác thực không hợp lệ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) {
      setError('Vui lòng nhập mật khẩu hiện tại để xác nhận.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await twoFactorApi.disable(disablePassword);
      setStep('STATUS');
      setDisablePassword('');
      if (refreshUserProfile) refreshUserProfile();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Mật khẩu không chính xác.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'secret' | 'backup') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    }
  };

  const downloadBackupCodes = () => {
    const element = document.createElement('a');
    const file = new Blob([
      `MÃ KHÔI PHỤC DỰ PHÒNG BẢO MẬT 2 LỚP (2FA)\n` +
      `Tài khoản: ${user?.username}\n` +
      `Trường: THPT Quất Lâm\n` +
      `Thời gian tạo: ${new Date().toLocaleString('vi-VN')}\n\n` +
      `LƯU Ý: Mỗi mã chỉ sử dụng được 01 lần khi bạn bị mất điện thoại hoặc không mở được app Google Authenticator.\n\n` +
      backupCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')
    ], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `2FA_Backup_Codes_${user?.username}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header Content */}
        <div className="flex items-center gap-3 p-6 sm:p-8 pb-4 shrink-0 border-b border-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Bảo Mật 2 Lớp (2FA)</h3>
            <p className="text-xs text-slate-400">Google Authenticator / TOTP</p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-4 custom-scrollbar">

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: STATUS OVERVIEW */}
        {step === 'STATUS' && (
          <div className="space-y-6">
            <div className={`rounded-2xl border p-5 text-center ${
              user?.is_two_factor_enabled
                ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                : 'border-slate-800 bg-slate-950/40 text-slate-300'
            }`}>
              <div className="flex justify-center mb-3">
                {user?.is_two_factor_enabled ? (
                  <ShieldCheck className="h-12 w-12 text-emerald-400 animate-pulse" />
                ) : (
                  <ShieldAlert className="h-12 w-12 text-amber-400" />
                )}
              </div>
              <div className="text-sm font-bold text-white">
                Trạng thái: {user?.is_two_factor_enabled ? 'ĐANG BẬT BẢO MẬT' : 'CHƯA BẬT BẢO MẬT'}
              </div>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                {user?.is_two_factor_enabled
                  ? 'Tài khoản của bạn đã được bảo vệ an toàn bằng mã OTP từ ứng dụng xác thực.'
                  : 'Bảo vệ tài khoản Giáo viên & Admin khỏi bị lộ mật khẩu bằng cách yêu cầu mã xác thực 6 số trên điện thoại khi đăng nhập.'}
              </p>
            </div>

            {user?.is_two_factor_enabled ? (
              <div className="space-y-3">
                <button
                  onClick={() => setStep('DISABLE')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-950/40 py-3 text-xs font-bold text-red-300 hover:bg-red-900/40 hover:text-white transition-all"
                >
                  <Lock className="h-4 w-4" />
                  <span>Tắt Bảo Mật 2 Lớp (2FA)</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full rounded-xl border border-slate-800 bg-slate-800/60 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleStartSetup}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Đang chuẩn bị...' : 'Bắt Đầu Kích Hoạt Ngay'}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={onClose}
                  className="w-full rounded-xl border border-slate-800 bg-slate-800/60 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                >
                  Để sau
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: SCAN QR CODE & ENTER 6-DIGIT CODE */}
        {step === 'SETUP' && (
          <form onSubmit={handleConfirmCode} className="space-y-5">
            <div className="text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-white">Bước 1: Quét mã QR trên ứng dụng</p>
              <p className="text-slate-400">
                Mở ứng dụng <strong>Google Authenticator</strong> hoặc <strong>Microsoft Authenticator</strong> trên điện thoại, bấm dấu <strong>+</strong> và chọn <strong>Quét mã QR</strong>.
              </p>
            </div>

            {/* QR Code display */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-white p-4 shadow-inner">
              {qrCode ? (
                <img src={qrCode} alt="2FA QR Code" className="h-48 w-48 rounded-lg" />
              ) : (
                <div className="h-48 w-48 flex items-center justify-center text-slate-500 text-xs">
                  Đang tải mã QR...
                </div>
              )}
            </div>

            {/* Manual Secret Code */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Hoặc nhập mã khóa thủ công:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(secret, 'secret')}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold"
                >
                  {copiedSecret ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedSecret ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-amber-400 tracking-wider font-bold break-all">
                {secret}
              </div>
            </div>

            {/* Step 2: Input code */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Bước 2: Nhập 6 chữ số hiển thị trên điện thoại
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Ví dụ: 849201"
                className="w-full text-center tracking-[0.4em] font-mono font-bold text-lg rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('STATUS')}
                className="w-1/3 rounded-xl border border-slate-800 bg-slate-800/60 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={isLoading || verificationCode.length < 6}
                className="w-2/3 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Đang xác thực...' : 'Xác Nhận & Kích Hoạt'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: BACKUP CODES DISPLAY */}
        {step === 'BACKUP_CODES' && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <ShieldCheck className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-white">Đã Kích Hoạt Bảo Mật 2 Lớp Thành Công!</div>
              <p className="mt-1 text-xs text-slate-300">
                Hãy lưu lại <strong>5 mã khôi phục dự phòng</strong> này ở nơi an toàn. Bạn có thể dùng mỗi mã một lần nếu chẳng may làm mất hoặc đổi điện thoại mới.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 py-2.5 font-mono text-sm font-bold tracking-wider text-amber-400"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => copyToClipboard(backupCodes.join('\n'), 'backup')}
                className="w-1/2 flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-3 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
              >
                {copiedBackup ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span>{copiedBackup ? 'Đã sao chép' : 'Sao chép mã'}</span>
              </button>
              <button
                type="button"
                onClick={downloadBackupCodes}
                className="w-1/2 flex items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-950/60 py-3 text-xs font-semibold text-blue-300 hover:bg-blue-900/60 hover:text-white transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Tải về tệp .txt</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition-all"
            >
              Tôi Đã Lưu Mã An Toàn — Hoàn Tất
            </button>
          </div>
        )}

        {/* STEP 4: DISABLE 2FA CONFIRMATION */}
        {step === 'DISABLE' && (
          <form onSubmit={handleDisable2FA} className="space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300">
              <p className="font-semibold text-white mb-1">Cảnh báo bảo mật:</p>
              <p>Tắt bảo mật 2 lớp sẽ làm giảm độ an toàn của tài khoản. Để tắt, vui lòng nhập mật khẩu đăng nhập hiện tại của bạn.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                required
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('STATUS')}
                className="w-1/2 rounded-xl border border-slate-800 bg-slate-800/60 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isLoading || !disablePassword}
                className="w-1/2 rounded-xl bg-red-600 py-3 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Đang xác nhận...' : 'Xác Nhận Tắt 2FA'}
              </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
};
