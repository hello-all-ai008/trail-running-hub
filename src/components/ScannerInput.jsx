import { useState, useEffect, useRef } from 'react';
import { Camera, ScanLine, X } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ScannerInput({ onScan }) {
  const [bibInput, setBibInput] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const lastScanned = useRef('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && bibInput.trim()) {
      onScan(bibInput.trim());
      setBibInput('');
    }
  };

  useEffect(() => {
    let scanner = null;
    
    if (showCamera) {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 100 },
          aspectRatio: 1.0
        },
        false
      );
      
      scanner.render(
        (decodedText) => {
          if (decodedText !== lastScanned.current) {
            lastScanned.current = decodedText;
            onScan(decodedText);
            
            // Allow re-scanning the same code after 3 seconds
            setTimeout(() => {
              lastScanned.current = '';
            }, 3000);
          }
        },
        (errorMessage) => {
          // Ignore frequent scanning errors (when no QR is in frame)
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner", error);
        });
      }
    };
  }, [showCamera, onScan]);

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
        <button 
          className={`btn-icon ${showCamera ? 'active' : ''}`} 
          title="สแกนด้วยกล้อง"
          onClick={() => setShowCamera(!showCamera)}
          style={{ background: showCamera ? 'var(--primary)' : '', color: showCamera ? '#fff' : '' }}
        >
          {showCamera ? <X size={24} /> : <Camera size={24} />}
        </button>
      </div>

      {showCamera && (
        <div style={{ marginTop: '16px', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
          <div id="qr-reader" width="100%"></div>
          <p style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center', margin: '8px', lineHeight: '1.4' }}>
            * หากกล้องไม่เปิดบนมือถือ/iPad โปรดตรวจสอบว่าใช้ลิงก์ที่เป็น <b>https://</b> <br/>
            หรือใช้งานผ่าน localhost เท่านั้น
          </p>
        </div>
      )}
    </div>
  );
}
