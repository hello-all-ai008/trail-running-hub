import { useState, useEffect, useRef } from 'react';
import { Camera, ScanLine, X, RefreshCcw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScannerInput({ onScan }) {
  const [bibInput, setBibInput] = useState('');
  const [showCamera, setShowCamera] = useState(() => {
    return localStorage.getItem('trail_camera_active') === 'true';
  });
  const [facingMode, setFacingMode] = useState(() => {
    return localStorage.getItem('trail_camera_facing') || 'environment';
  });

  useEffect(() => {
    localStorage.setItem('trail_camera_active', showCamera);
  }, [showCamera]);

  useEffect(() => {
    localStorage.setItem('trail_camera_facing', facingMode);
  }, [facingMode]);

  const html5QrCodeRef = useRef(null);
  const lastScanned = useRef('');
  const isScanningRef = useRef(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && bibInput.trim()) {
      onScan(bibInput.trim());
      setBibInput('');
    }
  };

  const startScanner = (mode) => {
    if (html5QrCodeRef.current && !isScanningRef.current) {
      isScanningRef.current = true;
      html5QrCodeRef.current.start(
        { facingMode: mode },
        {
          fps: 10,
          qrbox: { width: 250, height: 100 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          if (decodedText !== lastScanned.current) {
            lastScanned.current = decodedText;
            onScan(decodedText);
            setTimeout(() => {
              lastScanned.current = '';
            }, 3000);
          }
        },
        (errorMessage) => {
          // ignore
        }
      ).catch(err => {
        console.error("Camera start failed", err);
        isScanningRef.current = false;
      });
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        isScanningRef.current = false;
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  useEffect(() => {
    if (showCamera) {
      html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      startScanner(facingMode);
    } else {
      stopScanner().then(() => {
        if (html5QrCodeRef.current) {
          html5QrCodeRef.current.clear();
          html5QrCodeRef.current = null;
        }
      });
    }

    return () => {
      if (html5QrCodeRef.current) {
        stopScanner().then(() => {
          if (html5QrCodeRef.current) {
            html5QrCodeRef.current.clear();
          }
        });
      }
    };
  }, [showCamera]);

  const toggleCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    
    if (showCamera) {
      await stopScanner();
      startScanner(newMode);
    }
  };

  return (
    <div className="scan-wrapper" style={{ width: '100%' }}>
      <div className="scan-flex">
        <div className="scan-input-wrap">
          <ScanLine size={22} />
          <input 
            className="scan-input" 
            placeholder="สแกน BIB Barcode…" 
            autoComplete="off" 
            inputMode="numeric"
            value={bibInput}
            onChange={(e) => setBibInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus={!showCamera}
          />
        </div>
        
        {showCamera && (
          <button 
            className="btn-icon" 
            title="สลับกล้องหน้า/หลัง"
            onClick={toggleCamera}
            style={{ marginLeft: '8px' }}
          >
            <RefreshCcw size={22} />
          </button>
        )}

        <button 
          className={`btn-icon ${showCamera ? 'active' : ''}`} 
          title="สแกนด้วยกล้อง"
          onClick={() => setShowCamera(!showCamera)}
          style={{ background: showCamera ? 'var(--warn)' : '', color: showCamera ? '#fff' : '', marginLeft: '8px' }}
        >
          {showCamera ? <X size={24} /> : <Camera size={24} />}
        </button>
      </div>

      {showCamera && (
        <div style={{ marginTop: '16px', background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--line)' }}>
          <div id="qr-reader" style={{ width: '100%' }}></div>
          <p style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center', margin: '12px 8px', lineHeight: '1.4' }}>
            * หากกล้องไม่เปิดบนมือถือ/iPad โปรดตรวจสอบว่าใช้ลิงก์ที่เป็น <b>https://</b> <br/>
            หรือใช้งานผ่าน localhost เท่านั้น
          </p>
        </div>
      )}
    </div>
  );
}
