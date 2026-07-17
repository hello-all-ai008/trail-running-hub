import { useState } from 'react';
import { Camera, ScanLine } from 'lucide-react';

export default function ScannerInput({ onScan }) {
  const [bibInput, setBibInput] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && bibInput.trim()) {
      onScan(bibInput.trim());
      setBibInput('');
    }
  };

  return (
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
          autoFocus
        />
      </div>
      <button className="btn-icon" title="สแกนด้วยกล้อง">
        <Camera size={24} />
      </button>
    </div>
  );
}
