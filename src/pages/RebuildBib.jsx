import { useState, useMemo } from 'react';
import { useRace } from '../context/RaceContext';
import { Filter, Save, RefreshCw } from 'lucide-react';

export default function RebuildBib() {
  const { runners, assignNewBibs } = useRace();
  
  // Filters
  const [filterCat, setFilterCat] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterAge, setFilterAge] = useState('');

  // Start BIB number
  const [startBib, setStartBib] = useState('1001');

  // Dynamic filter options
  const availableCats = useMemo(() => [...new Set(runners.map(r => r.cat).filter(Boolean))].sort(), [runners]);
  const availableAges = useMemo(() => [...new Set(runners.map(r => r.age).filter(Boolean))].sort(), [runners]);

  const filteredRunners = useMemo(() => {
    let result = runners.filter(r => {
      if (filterCat && r.cat !== filterCat) return false;
      if (filterGender && r.gender !== filterGender) return false;
      if (filterAge && r.age !== filterAge) return false;
      return true;
    });

    // Sort alphabetically by name
    return result.sort((a, b) => a.name.localeCompare(b.name, 'th'));
  }, [runners, filterCat, filterGender, filterAge]);

  const assignments = useMemo(() => {
    const base = parseInt(startBib) || 1001;
    return filteredRunners.map((r, i) => ({
      oldBib: r.bib,
      newBib: String(base + i),
      name: r.name,
      cat: r.cat
    }));
  }, [filteredRunners, startBib]);

  const handleSave = () => {
    if (assignments.length === 0) return;
    if (window.confirm(`ยืนยันการเปลี่ยนหมายเลข BIB สำหรับนักวิ่ง ${assignments.length} ท่าน?`)) {
      assignNewBibs(assignments);
    }
  };

  return (
    <div className="page active">
      <div className="page-head">
        <span className="eyebrow">Tools</span>
        <h1>Rebuild BIB Numbers</h1>
        <p>สร้างและกำหนดหมายเลข BIB ใหม่ให้กับนักวิ่งตามกลุ่มที่ต้องการ</p>
      </div>

      <div className="bib-generator-layout" style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 150px)', paddingBottom: '2rem' }}>
        
        {/* Left Sidebar settings */}
        <div className="settings-panel card card-pad" style={{ flex: '0 0 350px', overflowY: 'auto' }}>
          
          <div className="filter-section" style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text)' }}>
              <Filter size={16} /> Filters
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', marginBottom: '0.25rem', display: 'block' }}>Category (ระยะทาง)</label>
                <select className="search" style={{ width: '100%' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                  <option value="">ทั้งหมด (All)</option>
                  {availableCats.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: '0.85rem', marginBottom: '0.25rem', display: 'block' }}>Gender (เพศ)</label>
                <select className="search" style={{ width: '100%' }} value={filterGender} onChange={e => setFilterGender(e.target.value)}>
                  <option value="">ทั้งหมด (All)</option>
                  <option value="M">Male (ชาย)</option>
                  <option value="F">Female (หญิง)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', marginBottom: '0.25rem', display: 'block' }}>Age Group (ช่วงอายุ)</label>
                <select className="search" style={{ width: '100%' }} value={filterAge} onChange={e => setFilterAge(e.target.value)}>
                  <option value="">ทั้งหมด (All)</option>
                  {availableAges.map(age => <option key={age} value={age}>{age}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Start BIB Number (หมายเลขเริ่มต้น)</label>
            <input 
              type="number" 
              className="search" 
              style={{ width: '100%' }} 
              value={startBib} 
              onChange={e => setStartBib(e.target.value)} 
              placeholder="e.g. 1001"
            />
          </div>

          <button 
            className="btn" 
            style={{ width: '100%', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'center', padding: '1rem' }} 
            onClick={handleSave}
            disabled={assignments.length === 0}
          >
            <Save size={18} style={{marginRight: 8}}/> Save & Assign New BIBs
          </button>

          <p style={{ marginTop: '1rem', color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center' }}>
            Found: {filteredRunners.length} runners
          </p>
        </div>

        {/* Right Preview - Data Table */}
        <div className="preview-panel card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <RefreshCw size={20} /> Preview New BIB Assignments
            </h3>
            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              นักวิ่งจะถูกจัดเรียงตามลำดับตัวอักษรของชื่อ (A-Z, ก-ฮ) ก่อนแจกหมายเลขใหม่
            </p>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'center', color: 'var(--muted)' }}>Old BIB</th>
                  <th style={{ textAlign: 'center', color: 'var(--primary)', fontWeight: 'bold' }}>New BIB</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length > 0 ? assignments.map((a, i) => (
                  <tr key={a.oldBib}>
                    <td style={{ color: 'var(--muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{a.name}</td>
                    <td><span className="badge">{a.cat}</span></td>
                    <td style={{ textAlign: 'center', color: 'var(--muted)', textDecoration: 'line-through' }}>{a.oldBib}</td>
                    <td style={{ textAlign: 'center', color: 'var(--primary)', fontWeight: 'bold' }}>{a.newBib}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                      ไม่พบข้อมูลนักวิ่งที่ตรงกับตัวกรอง
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
