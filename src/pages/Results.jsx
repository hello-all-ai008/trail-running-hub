import { useState } from 'react';
import { useRace, CATEGORIES } from '../context/RaceContext';
import ESlipModal from '../components/ESlipModal';

export default function Results() {
  const { runners } = useRace();
  const [catFilter, setCatFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [selectedRunner, setSelectedRunner] = useState(null);

  const fmtDur = (ms) => {
    if (ms == null) return '—';
    const s = Math.floor(ms / 1e3);
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor(s % 3600 / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${ss}`;
  };

  const finished = runners.filter(r => r.finish && r.checkin);
  
  const rankings = [...finished].sort((a, b) => {
    const timeA = a.finish - a.checkin;
    const timeB = b.finish - b.checkin;
    return timeA - timeB;
  });

  const getRank = (runner, list) => {
    return list.findIndex(r => r.bib === runner.bib) + 1;
  };

  const filtered = rankings.filter(r => {
    const matchCat = catFilter ? r.cat === catFilter : true;
    const matchGen = genderFilter ? r.gender === genderFilter : true;
    return matchCat && matchGen;
  });

  const exportResultsCSV = () => {
    const head = "Rank,BIB,Name,Category,Gender,Time\n";
    const body = filtered.map((r, i) => {
      const time = fmtDur(r.finish - r.checkin);
      return `${i+1},${r.bib},${r.name},${r.cat},${r.gender},${time}`;
    }).join('\n');
    
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(["\uFEFF"+head+body], {type:'text/csv;charset=utf-8'}));
    a.download = `results_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="page active">
      <div className="page-head">
        <span className="eyebrow">Report</span>
        <h1>ผลการแข่งขัน</h1>
        <p>จัดอันดับจาก Total Time (Finish − Check-in) แยกตามระยะ · กดดู e-Slip รายบุคคล</p>
      </div>
      
      <div className="toolbar">
        <select className="search" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">ทุกระยะ</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="search" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
          <option value="">ทุกเพศ</option>
          <option value="M">ชาย</option>
          <option value="F">หญิง</option>
        </select>
        <button className="btn btn-dark" onClick={exportResultsCSV}>Export ผลการแข่งขัน (CSV)</button>
      </div>

      <div className="card" style={{overflow: 'auto'}}>
        <table>
          <thead>
            <tr>
              <th style={{width: '60px'}}>Rank</th>
              <th>BIB</th>
              <th>Name</th>
              <th>Cat.</th>
              <th>Gen.</th>
              <th>Total Time</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((r, i) => (
              <tr key={r.bib}>
                <td style={{textAlign: 'center', fontWeight: 600, fontSize: '16px'}}>{i+1}</td>
                <td className="mono" style={{fontWeight: 600}}>{r.bib}</td>
                <td>{r.name}</td>
                <td className="mono">{r.cat}</td>
                <td>{r.gender}</td>
                <td className="mono" style={{fontWeight: 600, color: 'var(--ink)'}}>{fmtDur(r.finish - r.checkin)}</td>
                <td style={{textAlign: 'right'}}>
                  <button className="btn btn-sm" onClick={() => setSelectedRunner(r)}>e-Slip</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="7" className="empty">ยังไม่มีผลการแข่งขัน หรือไม่พบข้อมูลตามเงื่อนไข</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedRunner && (
        <ESlipModal 
          runner={selectedRunner} 
          overallRank={getRank(selectedRunner, rankings)}
          catRank={getRank(selectedRunner, rankings.filter(r => r.cat === selectedRunner.cat))}
          onClose={() => setSelectedRunner(null)} 
        />
      )}
    </div>
  );
}
