import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAntiCheatOptions {
  enabled: boolean;
  maxViolations: number;
  onViolation: (type: string, details?: string) => void;
  onMaxViolationsReached: () => void;
}

export const useAntiCheat = ({
  enabled,
  maxViolations,
  onViolation,
  onMaxViolationsReached,
}: UseAntiCheatOptions) => {
  const [violationCount, setViolationCount] = useState<number>(0);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const violationCountRef = useRef<number>(0);
  violationCountRef.current = violationCount;

  const playWarningBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(260, audioCtx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  const triggerViolation = useCallback(
    (type: string, msg: string) => {
      if (!enabled) return;

      playWarningBeep();
      const nextCount = violationCountRef.current + 1;
      setViolationCount(nextCount);
      setWarningMessage(msg);
      setShowWarningModal(true);

      onViolation(type, msg);

      if (nextCount >= maxViolations) {
        onMaxViolationsReached();
      }
    },
    [enabled, maxViolations, onViolation, onMaxViolationsReached]
  );

  const isExitingCleanlyRef = useRef<boolean>(false);

  const requestFullscreen = async () => {
    try {
      isExitingCleanlyRef.current = false;
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  const exitFullscreen = async () => {
    try {
      isExitingCleanlyRef.current = true;
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.warn('Fullscreen exit failed:', err);
    }
  };

  const closeWarningModal = () => {
    setShowWarningModal(false);
    // Request fullscreen again when closing warning modal
    requestFullscreen();
  };

  useEffect(() => {
    if (!enabled) return;

    // 1. Check Fullscreen changes
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        if (isExitingCleanlyRef.current) {
          return;
        }
        triggerViolation(
          'FULLSCREEN_EXIT',
          'Bạn đã thoát chế độ Toàn màn hình! Vui lòng quay lại chế độ toàn màn hình để tiếp tục làm bài.'
        );
      }
    };

    // 2. Tab Switch / Visibility Change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerViolation(
          'TAB_SWITCH',
          'Hệ thống phát hiện bạn đã chuyển Tab hoặc thu nhỏ trình duyệt!'
        );
      }
    };

    // 3. Window Blur (mất focus sang ứng dụng khác)
    const handleBlur = () => {
      triggerViolation(
        'WINDOW_BLUR',
        'Cửa sổ bài thi bị mất tiêu điểm (Focus). Nghi vấn sử dụng ứng dụng bên ngoài!'
      );
    };

    // 4. Disable DevTools & Shortcut keys
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('DEVTOOLS_KEY', 'Phím tắt F12 (DevTools) bị vô hiệu hóa.');
        return false;
      }

      // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('DEVTOOLS_KEY', 'Thao tác mở DevTools bị vô hiệu hóa.');
        return false;
      }

      // Block Ctrl+U (View Page Source)
      if (e.ctrlKey && ['u', 'U'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('DEVTOOLS_KEY', 'Thao tác xem mã nguồn trang web bị vô hiệu hóa.');
        return false;
      }

      // Block Ctrl+C, Ctrl+V, Ctrl+X (nhưng cho phép trong ô nhập liệu)
      if (e.ctrlKey && ['c', 'C', 'v', 'V', 'x', 'X', 'a', 'A'].includes(e.key)) {
        // M6: Cho phép thao tác bàn phím trong input/textarea (ví dụ: viết phản hồi)
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        // Prevent copying question text
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Block PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        triggerViolation('COPY_PASTE', 'Thao tác chụp màn hình (PrintScreen) bị cảnh báo!');
      }
    };

    // 5. Disable Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 6. Block Copy/Paste Events
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('paste', handlePaste);
    };
  }, [enabled, triggerViolation]);

  return {
    violationCount,
    showWarningModal,
    warningMessage,
    isFullscreen,
    requestFullscreen,
    exitFullscreen,
    closeWarningModal,
    setViolationCount,
  };
};
