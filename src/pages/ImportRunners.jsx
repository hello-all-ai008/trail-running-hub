import { useState } from 'react';
import { useRace } from '../context/RaceContext';

export default function ImportRunners() {
  const { importRunners, addToast } = useRace();
  const [formData, setFormData] = useState({
    bib: '', cat: '', name: '', gender: '', age: '', nat: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!formData.bib || !formData.cat || !formData.name || !formData.gender) {
      addToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', true);
      return;
    }
    const newRunner = {
      bib: formData.bib,
      name: formData.name,
      gender: formData.gender,
      age: formData.age || 'N/A',
      nat: formData.nat || 'THAI',
      cat: formData.cat,
      checkin: null,
      cps: {},
      finish: null
    };
    importRunners([newRunner]);
    setFormData({ bib: '', cat: '', name: '', gender: '', age: '', nat: '' });
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n');
      const newRunners = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const [bib, name, gender, age, cat, nat] = lines[i].split(',').map(s => s.trim());
        if (bib && name) {
          newRunners.push({
            bib, name, 
            gender: gender || 'M', 
            age: age || 'N/A', 
            cat: cat || 'OPEN', 
            nat: nat || 'THAI',
            checkin: null, cps: {}, finish: null
          });
        }
      }
      
      if (newRunners.length > 0) {
        importRunners(newRunners);
      } else {
        addToast('ไม่พบข้อมูลที่ถูกต้องในไฟล์ CSV', true);
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  return (
    <div className="page active">
      <div className="page-head">
        <span className="eyebrow">Data Management</span>
        <h1>เพิ่มข้อมูลนักวิ่ง (Import / Add)</h1>
        <p>เพิ่มนักวิ่งรายบุคคลแบบแมนนวล หรืออัปโหลดไฟล์ CSV เพื่อนำเข้าข้อมูลทีละหลายคน</p>
      </div>

      <div className="grid grid-2">
        <div className="card card-pad">
          <span className="eyebrow">Manual Entry</span>
          <h2 style={{fontSize: '16px', marginBottom: '14px', marginTop: '8px'}}>เพิ่มรายบุคคล</h2>
          <form style={{display: 'flex', flexDirection: 'column', gap: '12px'}} onSubmit={handleManualSubmit}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
              <input type="text" className="search" name="bib" value={formData.bib} onChange={handleChange} placeholder="BIB (เช่น 1001)" required />
              <input type="text" className="search" name="cat" value={formData.cat} onChange={handleChange} placeholder="ระยะ (เช่น MKT10)" required />
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
              <input type="text" className="search" name="name" value={formData.name} onChange={handleChange} placeholder="ชื่อ-นามสกุล" required />
              <select className="search" name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="" disabled>เพศ</option>
                <option value="M">ชาย (Male)</option>
                <option value="F">หญิง (Female)</option>
              </select>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
              <input type="text" className="search" name="age" value={formData.age} onChange={handleChange} placeholder="รุ่นอายุ (เช่น 20-29)" />
              <input type="text" className="search" name="nat" value={formData.nat} onChange={handleChange} placeholder="สัญชาติ (เช่น THAI)" />
            </div>
            <button type="submit" className="btn btn-dark" style={{marginTop: '8px'}}>บันทึกข้อมูลนักวิ่ง</button>
          </form>
        </div>

        <div className="card card-pad">
          <span className="eyebrow">Bulk Import</span>
          <h2 style={{fontSize: '16px', marginBottom: '14px', marginTop: '8px'}}>อัปโหลดไฟล์ CSV</h2>
          <div style={{border: '2px dashed var(--line)', borderRadius: '12px', padding: '30px', textAlign: 'center', color: 'var(--ink-2)', background: 'var(--bg-soft)'}}>
            <p style={{marginBottom: '12px', fontSize: '14px'}}>คลิกเพื่อเลือกไฟล์ CSV</p>
            <p style={{marginBottom: '16px', fontSize: '12px', opacity: 0.8}}>(รูปแบบ: BIB, Name, Gender, Age, Category, Nat)</p>
            <input type="file" id="file-csv" accept=".csv" style={{display: 'none'}} onChange={handleCSVUpload} />
            <button className="btn" onClick={() => document.getElementById('file-csv').click()}>เลือกไฟล์ CSV</button>
          </div>
        </div>
      </div>
    </div>
  );
}
