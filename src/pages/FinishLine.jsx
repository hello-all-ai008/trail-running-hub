import { useState, useMemo } from 'react';
import { useRace } from '../context/RaceContext';
import LedBoard from '../components/LedBoard';
import ScannerInput from '../components/ScannerInput';

export default function FinishLine() {
  const { processScan, scanLog } = useRace();
  const [ledState, setLedState] = useState({ runner: null, message: '', warn: false });

  const fmtDur = (ms) => {
    if (ms == null) return '—';
    const s = Math.floor(ms / 1e3);
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor(s % 3600 / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${ss}`;
  };

  const handleScan = (bib) => {
    const result = processScan('Finish', bib);
    
    if (!result.success) {
      setLedState({ 
        runner: result.runner || { bib, name: 'NOT FOUND', nat: '', age: '', cat: '' }, 
        message: result.message, 
        warn: true 
      });
    } else {
      const d = new Date(result.now);
      const totalTime = fmtDur(result.now - result.runner.checkin);
      setLedState({ 
        runner: result.runner, 
        message: `Total Time ${totalTime}`, 
        warn: false 
      });
    }
  };

  const recentLog = useMemo(() => {
    return scanLog.filter(log => log.station === 'Finish').slice(0, 5);
  }, [scanLog]);

  return (
    <div className="page active">
      <div className="page-head">
        <span className="station-tag tag-fin"><span className="dot"></span>Station · Finish</span>
        <h1>Finish Line เส้นชัย</h1>
        <p>ยิงบาร์โค้ดเมื่อนักวิ่งเข้าเส้นชัย ระบบคำนวณ Total Time และจัดอันดับให้ทันที</p>
      </div>
      
      <div className="station">
        <div>
          <ScannerInput onScan={handleScan} />
          <p className="scan-hint">สแกนซ้ำจะไม่ทับเวลาเดิม — ยึดเวลา Finish ครั้งแรกเสมอ</p>
          
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
