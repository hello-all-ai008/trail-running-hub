import { useState } from 'react';
import { useRace, CATEGORIES } from '../context/RaceContext';

export default function RunnersList() {
  const { runners } = useRace();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const statusOf = (r) => {
    if(r.finish) return {cls:'b-fin', txt:'Finished'};
    const cps = Object.keys(r.cps);
    if(cps.length) return {cls:'b-cp', txt:'At '+cps.sort().pop()};
    if(r.checkin) return {cls:'b-start', txt:'Checked-in'};
    return {cls:'b-reg', txt:'Registered'};
  };

  const filtered = runners.filter(r => {
    const matchSearch = (r.bib.includes(search) || r.name.toLowerCase().includes(search.toLowerCase()));
    const matchCat = catFilter ? r.cat === catFilter : true;
    return matchSearch && matchCat;
  });

  const exportCSV = () => {
    const head = "BIB,Name,Gender,Age,Category,Nationality,Status,Check-in,Finish\n";
    const body = filtered.map(r => {
      const s = statusOf(r).txt;
      const ci = r.checkin ? new Date(r.checkin).toTimeString().slice(0,8) : '';
      const f = r.finish ? new Date(r.finish).toTimeString().slice(0,8) : '';
      return `${r.bib},${r.name},${r.gender},${r.age},${r.cat},${r.nat},${s},${ci},${f}`;
    }).join('\n');
    
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(["\uFEFF"+head+body], {type:'text/csv;charset=utf-8'}));
    a.download = `runners_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="page active">
      <div className="page-head">
        <span className="eyebrow">Database</span>
        <h1>รายชื่อนักวิ่ง</h1>
        <p>ฐานข้อมูลผู้สมัคร (นำเข้าจากไฟล์ Excel) — ค้นหาจาก BIB หรือชื่อเพื่อตรวจสอบสถานะ</p>
      </div>

      <div className="toolbar">
        <input 
          className="search" 
          placeholder="ค้นหา BIB, ชื่อ-นามสกุล…" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="search" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">ทุกระยะ</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn" onClick={exportCSV}>Export CSV</button>
      </div>

      <div className="card" style={{overflow: 'auto'}}>
        <table>
          <thead>
            <tr>
              <th>BIB</th>
              <th>Name</th>
              <th>Cat.</th>
              <th>Gen.</th>
              <th>Age</th>
              <th>Nat.</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(r => {
              const s = statusOf(r);
              return (
                <tr key={r.bib}>
                  <td className="mono" style={{fontWeight: 600}}>{r.bib}</td>
                  <td>{r.name}</td>
                  <td className="mono">{r.cat}</td>
                  <td>{r.gender}</td>
                  <td className="mono">{r.age}</td>
                  <td>{r.nat}</td>
                  <td>
                    <span className={`badge ${s.cls}`}>
                      <span className="dot"></span>{s.txt}
                    </span>
                  </td>
                </tr>
              )
            }) : (
              <tr><td colSpan="7" className="empty">ไม่พบข้อมูล</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
