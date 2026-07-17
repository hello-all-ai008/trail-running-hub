import { useState, useEffect } from 'react';
import { useRace } from '../context/RaceContext';

export default function LiveStream() {
  const { runners, scanLog } = useRace();
  const [liveData, setLiveData] = useState(null);
  const [flash, setFlash] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (scanLog.length > 0) {
      const latestLog = scanLog[0];
      const r = runners.find(x => x.bib === latestLog.bib);
      
      // Update history
      const newHistory = scanLog.slice(0, 10).map(log => {
        const hr = runners.find(x => x.bib === log.bib);
        return { ...log, cat: hr?.cat || '' };
      });
      setHistory(newHistory);

      // Flash on new scan
      if (liveData?.time !== latestLog.time) {
        setLiveData({ ...latestLog, runner: r });
        setFlash(false);
        setTimeout(() => setFlash(true), 50);
      }
    }
  }, [scanLog]);

  const simulateScan = () => {
    // Just a fun UI effect for the demo if there's no live incoming data
    setFlash(false);
    setTimeout(() => setFlash(true), 50);
  };

  const fmtDur = (ms) => {
    if (ms == null) return '00:00:00';
    const s = Math.floor(ms / 1e3);
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor(s % 3600 / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${ss}`;
  };

  return (
    <div className="page active" id="page-live">
      <div className="live-toolbar">
        <div className="page-head" style={{margin: 0, textAlign: 'left'}}>
          <span className="eyebrow">Presentation View</span>
          <h1>Live Stream 🌟</h1>
        </div>
        <button className="btn btn-dark" onClick={simulateScan}>✨ ทดสอบจำลองสแกน (Simulate)</button>
      </div>
      
      <div className="live-stage">
        <div className={`live-card show ${flash ? 'flash' : ''}`} id="live-card">
          <div className="live-badge" id="live-badge">{liveData ? liveData.station : 'READY'}</div>
          
          <div className="bib" id="live-bib">
            {liveData ? liveData.bib : '---'}
          </div>
          
          <div className="name" id="live-name">
            {liveData?.runner ? liveData.runner.name.toUpperCase() : 'รอการเชื่อมต่อ...'}
          </div>
          
          <div className="meta" id="live-meta">
            {liveData?.runner ? `${liveData.runner.nat} · ${liveData.runner.age} · ${liveData.runner.cat}` : 'กรุณาสแกนนักวิ่ง หรือกดปุ่ม Simulate'}
          </div>
          
          <div className="time" id="live-time">
            {liveData?.runner?.checkin && liveData.time 
              ? fmtDur(liveData.time - liveData.runner.checkin) 
              : '00:00:00'}
          </div>
        </div>
        
        <div className="live-history" id="live-history">
          {history.map((h, i) => (
            <div className="hist-item" key={i}>
              <div className="h-bib">{h.bib}</div>
              <div className="h-name">{h.name}</div>
              <div className="h-station">{h.station} · {new Date(h.time).toTimeString().slice(0,8)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
