import { useState, useMemo } from 'react';
import { useRace, CHECKPOINTS } from '../context/RaceContext';
import LedBoard from '../components/LedBoard';
import ScannerInput from '../components/ScannerInput';

export default function CheckPoint() {
  const { processScan, scanLog } = useRace();
  const [ledState, setLedState] = useState({ runner: null, message: '', warn: false });
  const [selectedCp, setSelectedCp] = useState(CHECKPOINTS[0].id);

  const handleScan = (bib) => {
    const result = processScan('CheckPoint', bib, selectedCp);
    
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
    const cpName = CHECKPOINTS.find(c => c.id === selectedCp)?.name;
    return scanLog.filter(log => log.station === cpName).slice(0, 5);
  }, [scanLog, selectedCp]);

  return (
    <div className="page active">
      <div className="page-head">
        <span className="station-tag tag-cp"><span className="dot"></span>Station · Check Point</span>
        <h1>Check Point ระหว่างเส้นทาง</h1>
        <p>เลือกจุดเช็คพอยต์ที่เจ้าหน้าที่ประจำอยู่ แล้วยิงบาร์โค้ดนักวิ่งที่ผ่านจุด</p>
      </div>
      
      <div className="station">
        <div>
          <div className="toolbar">
            <select className="search" value={selectedCp} onChange={(e) => setSelectedCp(e.target.value)}>
              {CHECKPOINTS.map(cp => <option key={cp.id} value={cp.id}>{cp.name}</option>)}
            </select>
          </div>
          
          <ScannerInput onScan={handleScan} />
          <p className="scan-hint">นักวิ่งต้องผ่าน Check-in ก่อน จึงจะบันทึกเวลาที่จุดนี้ได้</p>
          
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
