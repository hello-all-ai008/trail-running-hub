import { useState, useMemo } from 'react';
import { useRace } from '../context/RaceContext';
import LedBoard from '../components/LedBoard';
import ScannerInput from '../components/ScannerInput';

export default function CheckIn() {
  const { processScan, scanLog } = useRace();
  const [ledState, setLedState] = useState({ runner: null, message: '', warn: false });

  const handleScan = (bib) => {
    const result = processScan('Check-in', bib);
    
    if (!result.success) {
      setLedState({ 
        runner: result.runner || { bib, name: 'NOT FOUND', nat: '', age: '', cat: '' }, 
        message: result.message, 
        warn: true 
      });
    } else {
      const d = new Date(result.now);
      setLedState({ 
        runner: result.runner, 
        message: `Check in : ${d.toTimeString().slice(0, 8)}`, 
        warn: false 
      });
    }
  };

  const recentLog = useMemo(() => {
    return scanLog.filter(log => log.station === 'Check-in').slice(0, 5);
  }, [scanLog]);

  return (
    <div className="page active">
      <div className="page-head">
        <span className="station-tag tag-start"><span className="dot"></span>Station · Start</span>
        <h1>Check-in จุดปล่อยตัว</h1>
        <p>ยิงบาร์โค้ดบน BIB หรือพิมพ์หมายเลขแล้วกด Enter — ระบบบันทึกเวลาเช็คอินอัตโนมัติ</p>
      </div>
      
      <div className="station">
        <div>
          <ScannerInput onScan={handleScan} />
          <p className="scan-hint">เครื่องยิงบาร์โค้ดจะพิมพ์หมายเลขและกด <span className="kbd">Enter</span> ให้อัตโนมัติ · โฟกัสค้างที่ช่องนี้เสมอ</p>
          
          <div className="card" style={{marginTop: '16px', overflow: 'auto'}}>
            <table>
              <tbody>
                {recentLog.map((log, i) => (
                  <tr key={i}>
                    <td className="mono" style={{width: '90px'}}>{new Date(log.time).toTimeString().slice(0,8)}</td>
                    <td className="mono" style={{fontWeight: 600}}>{log.bib}</td>
                    <td>{log.name}</td>
                    <td style={{textAlign: 'right'}}>
                      {log.ok ? <span style={{color: 'var(--ok)'}}>✓</span> : <span style={{color: 'var(--warn)'}}>✗ {log.msg}</span>}
                    </td>
                  </tr>
                ))}
                {recentLog.length === 0 && <tr><td colSpan="4" className="empty">ยังไม่มีการสแกน</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        
        <LedBoard runner={ledState.runner} message={ledState.message} warn={ledState.warn} />
      </div>
    </div>
  );
}
