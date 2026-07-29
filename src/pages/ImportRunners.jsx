import { useState } from 'react';
import { useRace } from '../context/RaceContext';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';

export default function ImportRunners() {
  const { importRunners, addToast } = useRace();
  const [formData, setFormData] = useState({
    bib: '', cat: '', name: '', gender: '', age: '', nat: ''
  });
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [msg, setMsg] = useState('');
  const [isManualOpen, setIsManualOpen] = useState(false);

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


  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (json.length === 0) {
        setMsg('ไฟล์ไม่มีข้อมูล');
        return;
      }
      const headerRow = json[0];
      const rows = json.slice(1).map(row => {
        const title = String(row[1] || '').trim();
        const fullName = String(row[2] || '').trim();
        const name = fullName;
        
        const rawCat = String(row[4] || '').trim();
        let distance = null;
        let unit = '';
        let cat_name = rawCat;
        
        // Match e.g., "10 KM : Hard Rock"
        // Also supports "5 KM : Soft Rock"
        const catMatch = rawCat.match(/^([\d.]+)\s*([a-zA-Z]+)\s*:\s*(.*)$/);
        if (catMatch) {
          distance = parseFloat(catMatch[1]);
          unit = catMatch[2];
          cat_name = catMatch[3].trim();
        }
        
        return {
          bib: String(row[0] || ''),
          title: title,
          name: name,
          gender: String(row[3] || '').trim() || 'M',
          cat: rawCat,
          distance: distance,
          unit: unit,
          cat_name: cat_name,
          payment_status: String(row[5] || '').trim(),
          age_group: String(row[6] || '').trim() || 'N/A',
          age: String(row[6] || '').trim() || 'N/A',
          nat: 'THAI'
        };
      });

      setHeaders(headerRow);
      setData(rows); // rows has mapped keys (bib, name, etc.)
      setMsg(`พบข้อมูล ${rows.length} รายการ (ยังไม่ได้บันทึก กรุณาตรวจสอบแล้วกดยืนยัน)`);
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmUpload = async () => {
    if (data.length === 0) return;
    setMsg('กำลังอัปโหลดข้อมูล...');
    const { error, data: inserted } = await supabase.from('runners').insert(data);
    if (error) {
      console.error('Supabase insert error:', error);
      addToast(`อัพโหลด Excel ไม่สำเร็จ: ${error.message}`, true);
      setMsg(`อัพโหลดไม่สำเร็จ: ${error.message}`);
    } else {
      setMsg(`อัพโหลด Excel เข้า Database สำเร็จ ${data.length} รายการ! 🎉`);
      addToast(`อัพโหลด Excel สำเร็จ ${data.length} รายการ`, false);
      importRunners(data);
    }
  };

  return (
    <div className="page active">
      <div className="page-head">
        <span className="eyebrow">Data Management</span>
        <h1>เพิ่มข้อมูลนักวิ่ง (Import / Add)</h1>
        <p>เพิ่มนักวิ่งรายบุคคลแบบแมนนวล หรืออัปโหลดไฟล์ Excel เพื่อนำเข้าข้อมูลทีละหลายคน</p>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div className="card card-pad" style={{ 
          flex: isManualOpen ? '1' : '0 0 auto', 
          width: isManualOpen ? '50%' : 'auto',
          minWidth: isManualOpen ? 'auto' : '200px',
          transition: 'all 0.3s ease' 
        }}>
          <div 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: isManualOpen ? '14px' : '0' }} 
            onClick={() => setIsManualOpen(!isManualOpen)}
          >
            <div>
              <span className="eyebrow">Manual Entry</span>
              <h2 style={{fontSize: '16px', margin: '8px 0 0 0'}}>เพิ่มรายบุคคล</h2>
            </div>
            <button type="button" className="btn" style={{ padding: '4px 12px', fontSize: '12px' }}>
              {isManualOpen ? '▼ ย่อลง' : '▶ ขยาย'}
            </button>
          </div>
          
          {isManualOpen && (
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
          )}
        </div>


{/* Bulk Excel Import */}
<div className="card card-pad" style={{ flex: '1', width: '100%', marginBottom: '20px' }}>
  <span className="eyebrow">Bulk Excel Import</span>
  <h2 style={{ fontSize: '16px', marginBottom: '14px', marginTop: '8px' }}>อัปโหลดไฟล์ Excel</h2>
  <div style={{ border: '2px dashed var(--line)', borderRadius: '12px', padding: '30px', textAlign: 'center', color: 'var(--ink-2)', background: 'var(--bg-soft)' }}>
    <p style={{ marginBottom: '12px', fontSize: '14px' }}>คลิกเพื่อเลือกไฟล์ Excel (.xlsx / .xls)</p>
    <input type="file" id="file-excel" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleExcelUpload} />
    <button className="btn" onClick={() => document.getElementById('file-excel').click()}>เลือกไฟล์ Excel</button>
  </div>
  {msg && <p style={{ color: '#2d3748', marginTop: '15px' }}>{msg}</p>}
  {data.length > 0 && (
    <div style={{ overflowX: 'auto', marginTop: '20px' }}>
      <div style={{ textAlign: 'right', marginBottom: '15px' }}>
        <button className="btn btn-dark" onClick={handleConfirmUpload}>✅ ยืนยันการบันทึกข้อมูลลง Database</button>
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '14px', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #e6e9ed', background: '#f7f8f9', padding: '12px', textAlign: 'left' }}>NO (ลำดับ)</th>
            <th style={{ border: '1px solid #e6e9ed', background: '#f7f8f9', padding: '12px', textAlign: 'left' }}>Title</th>
            <th style={{ border: '1px solid #e6e9ed', background: '#f7f8f9', padding: '12px', textAlign: 'left' }}>Name</th>
            <th style={{ border: '1px solid #e6e9ed', background: '#f7f8f9', padding: '12px', textAlign: 'left' }}>Gender</th>
            <th style={{ border: '1px solid #e6e9ed', background: '#f7f8f9', padding: '12px', textAlign: 'left' }}>Age Group</th>
            <th style={{ border: '1px solid #e6e9ed', background: '#f7f8f9', padding: '12px', textAlign: 'left' }}>Distance</th>
            <th style={{ border: '1px solid #e6e9ed', background: '#f7f8f9', padding: '12px', textAlign: 'left' }}>Unit</th>
            <th style={{ border: '1px solid #e6e9ed', background: '#f7f8f9', padding: '12px', textAlign: 'left' }}>Category Name</th>
            <th style={{ border: '1px solid #e6e9ed', background: '#f7f8f9', padding: '12px', textAlign: 'left' }}>Status</th>
            <th style={{ border: '1px solid #e6e9ed', background: '#f7f8f9', padding: '12px', textAlign: 'left' }}>Nat</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #e6e9ed', padding: '12px' }}>{row.bib}</td>
              <td style={{ border: '1px solid #e6e9ed', padding: '12px' }}>{row.title}</td>
              <td style={{ border: '1px solid #e6e9ed', padding: '12px' }}>{row.name}</td>
              <td style={{ border: '1px solid #e6e9ed', padding: '12px' }}>{row.gender}</td>
              <td style={{ border: '1px solid #e6e9ed', padding: '12px' }}>{row.age_group}</td>
              <td style={{ border: '1px solid #e6e9ed', padding: '12px' }}>{row.distance}</td>
              <td style={{ border: '1px solid #e6e9ed', padding: '12px' }}>{row.unit}</td>
              <td style={{ border: '1px solid #e6e9ed', padding: '12px' }}>{row.cat_name}</td>
              <td style={{ border: '1px solid #e6e9ed', padding: '12px' }}>{row.payment_status}</td>
              <td style={{ border: '1px solid #e6e9ed', padding: '12px' }}>{row.nat}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
      </div>
    </div>
  );
}
