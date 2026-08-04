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

  // Active tab state
  const [activeTab, setActiveTab] = useState('excel'); // 'excel' | 'manual'

  return (
    <div className="page active">
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <span className="eyebrow">Data Management</span>
          <h1 style={{ marginBottom: '4px' }}>เพิ่มข้อมูลนักวิ่ง (Import / Add)</h1>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>เพิ่มนักวิ่งรายบุคคลแบบแมนนวล หรืออัปโหลดไฟล์ Excel เพื่อนำเข้าข้อมูลทีละหลายคน</p>
        </div>
      </div>

      {/* ── Toolbar: tab buttons ── */}
      <div className="card" style={{ padding: '8px 12px', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('excel')}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
              background: activeTab === 'excel' ? 'var(--ink)' : 'transparent',
              color: activeTab === 'excel' ? '#fff' : 'var(--ink-2)',
              transition: 'all .15s',
            }}
          >
            📄 นำเข้าจาก Excel
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
              background: activeTab === 'manual' ? 'var(--ink)' : 'transparent',
              color: activeTab === 'manual' ? '#fff' : 'var(--ink-2)',
              transition: 'all .15s',
            }}
          >
            ✍️ เพิ่มแบบ Manual
          </button>
        </div>
      </div>

      {/* ── Tab: Excel Import ── */}
      {activeTab === 'excel' && (
        <div className="card card-pad" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '18px', margin: 0 }}>อัปโหลดไฟล์ Excel</h2>
            {data.length > 0 && (
              <button className="btn" style={{ background: 'var(--primary)', color: '#000', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleConfirmUpload}>
                ✅ ยืนยันการบันทึกข้อมูล ({data.length})
              </button>
            )}
          </div>

          <div style={{ border: '2px dashed var(--line)', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', color: 'var(--ink-2)', background: 'var(--bg-soft)', transition: 'all 0.2s', cursor: 'pointer' }} onClick={() => document.getElementById('file-excel').click()}>
            <div style={{ fontSize: '3rem', marginBottom: '10px', opacity: 0.5 }}>📁</div>
            <p style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 500, color: 'var(--ink)' }}>คลิกเพื่อเลือกไฟล์ Excel (.xlsx / .xls)</p>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', opacity: 0.8 }}>รองรับไฟล์ตารางรายชื่อนักวิ่งที่มีหัวคอลัมน์ชัดเจน</p>
            <input type="file" id="file-excel" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleExcelUpload} />
            <button className="btn" style={{ background: 'var(--border)', color: 'var(--ink)' }} onClick={(e) => { e.stopPropagation(); document.getElementById('file-excel').click(); }}>
              เลือกไฟล์ Excel
            </button>
          </div>
          
          {msg && (
            <div style={{ marginTop: '15px', padding: '12px', background: 'var(--bg-soft)', borderRadius: '8px', borderLeft: '4px solid var(--primary)', fontSize: '0.9rem', fontWeight: 500 }}>
              {msg}
            </div>
          )}

          {data.length > 0 && (
            <div style={{ overflowX: 'auto', marginTop: '20px', border: '1px solid var(--line)', borderRadius: '8px' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-soft)', padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--ink)' }}>NO</th>
                    <th style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-soft)', padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--ink)' }}>Title</th>
                    <th style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-soft)', padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--ink)' }}>Name</th>
                    <th style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-soft)', padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--ink)' }}>Gender</th>
                    <th style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-soft)', padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--ink)' }}>Age Group</th>
                    <th style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-soft)', padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--ink)' }}>Distance</th>
                    <th style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-soft)', padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--ink)' }}>Unit</th>
                    <th style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-soft)', padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--ink)' }}>Category</th>
                    <th style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-soft)', padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--ink)' }}>Status</th>
                    <th style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-soft)', padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--ink)' }}>Nat</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? 'transparent' : 'var(--bg-soft)', transition: 'background 0.1s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--line)'} onMouseOut={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'var(--bg-soft)'}>
                      <td style={{ borderBottom: '1px solid var(--line)', padding: '10px 12px' }}>{row.bib}</td>
                      <td style={{ borderBottom: '1px solid var(--line)', padding: '10px 12px', color: 'var(--ink-2)' }}>{row.title}</td>
                      <td style={{ borderBottom: '1px solid var(--line)', padding: '10px 12px', fontWeight: 500 }}>{row.name}</td>
                      <td style={{ borderBottom: '1px solid var(--line)', padding: '10px 12px' }}>{row.gender}</td>
                      <td style={{ borderBottom: '1px solid var(--line)', padding: '10px 12px' }}>{row.age_group}</td>
                      <td style={{ borderBottom: '1px solid var(--line)', padding: '10px 12px' }}>{row.distance}</td>
                      <td style={{ borderBottom: '1px solid var(--line)', padding: '10px 12px', color: 'var(--ink-2)' }}>{row.unit}</td>
                      <td style={{ borderBottom: '1px solid var(--line)', padding: '10px 12px' }}>{row.cat_name}</td>
                      <td style={{ borderBottom: '1px solid var(--line)', padding: '10px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: row.payment_status?.toLowerCase().includes('paid') ? '#dcfce7' : 'var(--border)', color: row.payment_status?.toLowerCase().includes('paid') ? '#166534' : 'var(--ink)' }}>
                          {row.payment_status || 'N/A'}
                        </span>
                      </td>
                      <td style={{ borderBottom: '1px solid var(--line)', padding: '10px 12px', color: 'var(--ink-2)' }}>{row.nat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Manual Entry ── */}
      {activeTab === 'manual' && (
        <div className="card card-pad" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>เพิ่มรายบุคคล</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ink-2)' }}>กรอกข้อมูลนักวิ่งเพื่อเพิ่มเข้าสู่ระบบโดยตรง</p>
          </div>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleManualSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 500, color: 'var(--ink)' }}>BIB <span style={{color: 'var(--warn)'}}>*</span></label>
                <input type="text" className="search" name="bib" value={formData.bib} onChange={handleChange} placeholder="เช่น 1001" required style={{ width: '100%', padding: '10px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 500, color: 'var(--ink)' }}>ระยะทาง (Category) <span style={{color: 'var(--warn)'}}>*</span></label>
                <input type="text" className="search" name="cat" value={formData.cat} onChange={handleChange} placeholder="เช่น MKT10" required style={{ width: '100%', padding: '10px' }} />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 500, color: 'var(--ink)' }}>ชื่อ-นามสกุล <span style={{color: 'var(--warn)'}}>*</span></label>
                <input type="text" className="search" name="name" value={formData.name} onChange={handleChange} placeholder="สมชาย ใจดี" required style={{ width: '100%', padding: '10px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 500, color: 'var(--ink)' }}>เพศ <span style={{color: 'var(--warn)'}}>*</span></label>
                <select className="search" name="gender" value={formData.gender} onChange={handleChange} required style={{ width: '100%', padding: '10px' }}>
                  <option value="" disabled>เลือกเพศ</option>
                  <option value="M">ชาย (Male)</option>
                  <option value="F">หญิง (Female)</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 500, color: 'var(--ink)' }}>รุ่นอายุ (Age Group)</label>
                <input type="text" className="search" name="age" value={formData.age} onChange={handleChange} placeholder="เช่น 20-29" style={{ width: '100%', padding: '10px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 500, color: 'var(--ink)' }}>สัญชาติ (Nationality)</label>
                <input type="text" className="search" name="nat" value={formData.nat} onChange={handleChange} placeholder="เช่น THAI" style={{ width: '100%', padding: '10px' }} />
              </div>
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <button type="submit" className="btn" style={{ width: '100%', background: 'var(--ink)', color: '#fff', padding: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                ✍️ บันทึกข้อมูลนักวิ่ง
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
