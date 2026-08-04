import { useState, useRef, useEffect, useMemo } from 'react';
import { useRace } from '../context/RaceContext';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { Upload, Download, Image as ImageIcon, Filter, Plus } from 'lucide-react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

// Component for rendering preview elements (so we can generate QR asynchronously)
function PreviewElement({ item, scale, onMouseDown, dragItem }) {
  const [imgSrc, setImgSrc] = useState(null);
  
  const textToDraw = item.text.replace(/{BIB}/g, '9999').replace(/{NAME}/g, 'Somchai Jaidee');

  useEffect(() => {
    if (item.type === 'qr') {
      const size = Math.max(50, item.fontSize * 3);
      QRCode.toDataURL(textToDraw, { margin: 1, width: size })
        .then(url => setImgSrc(url))
        .catch(() => setImgSrc(null));
    } else if (item.type === 'barcode') {
      try {
        const c = document.createElement('canvas');
        JsBarcode(c, textToDraw, { 
          margin: 0, 
          displayValue: false, 
          height: 100,
          width: 2
        });
        setImgSrc(c.toDataURL('image/png'));
      } catch (e) {
        setImgSrc(null);
      }
    }
  }, [item.type, item.fontSize, textToDraw]);

  const baseStyle = {
    position: 'absolute',
    top: 0, left: 0,
    transform: `translate(${item.x * scale}px, ${item.y * scale}px)`,
    cursor: dragItem === `custom-${item.id}` ? 'grabbing' : 'grab',
    userSelect: 'none',
    transformOrigin: 'top left',
    lineHeight: 1,
  };

  if (item.type === 'qr' || item.type === 'barcode') {
    if (!imgSrc) return <div style={baseStyle} onMouseDown={onMouseDown}>...</div>;
    // For QR and barcode, we scale them by `scale` just like text position
    return (
      <img 
        src={imgSrc} 
        style={{ 
          ...baseStyle, 
          width: item.type === 'barcode' ? `${item.barcodeWidth || 150}px` : undefined,
          height: item.type === 'barcode' ? `${item.barcodeHeight || 50}px` : undefined,
          transform: `translate(${item.x * scale}px, ${item.y * scale}px) scale(${scale})` 
        }} 
        onMouseDown={onMouseDown} 
        alt={textToDraw} 
        draggable="false"
      />
    );
  }

  // Normal Text
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        ...baseStyle,
        fontFamily: item.fontFamily,
        fontSize: `${item.fontSize * scale}px`,
        fontWeight: item.fontWeight,
        color: item.color,
        whiteSpace: 'nowrap',
      }}
    >
      {textToDraw}
    </div>
  );
}

export default function AutoBibGenerator() {
  const { runners, addToast } = useRace();
  const [bgImage, setBgImage] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scale, setScale] = useState(1);

  // Filters
  const [filterCat, setFilterCat] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterAge, setFilterAge] = useState('');

  // Active settings tab
  const [activeTab, setActiveTab] = useState('filters');

  const [bibStyle, setBibStyle] = useState({
    x: 50, y: 50, fontSize: 100,
    color: '#000000', fontWeight: 'bold', fontFamily: 'Inter'
  });

  const [nameStyle, setNameStyle] = useState({
    x: 50, y: 200, fontSize: 40,
    color: '#333333', fontWeight: 'normal', fontFamily: 'Inter'
  });

  const [customTexts, setCustomTexts] = useState([]);

  const previewRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const [dragItem, setDragItem] = useState(null);

  const addCustomText = () => {
    setCustomTexts([...customTexts, {
      id: Date.now().toString(),
      type: 'text',
      text: 'Custom Text',
      x: 50, y: 100, fontSize: 30,
      color: '#000000', fontWeight: 'normal', fontFamily: 'Inter',
      barcodeWidth: 150, barcodeHeight: 50
    }]);
  };
  
  const updateCustomText = (id, updates) => {
    setCustomTexts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };
  
  const removeCustomText = (id) => {
    setCustomTexts(prev => prev.filter(t => t.id !== id));
  };

  const availableCats = useMemo(() => [...new Set(runners.map(r => r.cat).filter(Boolean))].sort(), [runners]);
  const availableAges = useMemo(() => [...new Set(runners.map(r => r.age).filter(Boolean))].sort(), [runners]);

  const filteredRunners = useMemo(() => {
    return runners.filter(r => {
      if (filterCat && r.cat !== filterCat) return false;
      if (filterGender && r.gender !== filterGender) return false;
      if (filterAge && r.age !== filterAge) return false;
      return true;
    });
  }, [runners, filterCat, filterGender, filterAge]);

  useEffect(() => {
    const updateScale = () => {
      if (imgRef.current && imageSize.width > 0) {
        setScale(imgRef.current.clientWidth / imageSize.width);
      }
    };
    window.addEventListener('resize', updateScale);
    setTimeout(updateScale, 100);
    return () => window.removeEventListener('resize', updateScale);
  }, [imageSize, bgImage]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
        setBgImage(url);
      };
      img.src = url;
    }
  };

  const handleMouseDown = (e, item) => { e.preventDefault(); setDragItem(item); };

  const handleMouseMove = (e) => {
    if (!dragItem || !previewRef.current || !imgRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const currentScale = imageSize.width / imgRef.current.clientWidth;
    let x = (e.clientX - rect.left) * currentScale;
    let y = (e.clientY - rect.top) * currentScale;
    if (dragItem === 'bib') setBibStyle(prev => ({ ...prev, x, y }));
    else if (dragItem === 'name') setNameStyle(prev => ({ ...prev, x, y }));
    else if (dragItem?.startsWith('custom-')) updateCustomText(dragItem.replace('custom-', ''), { x, y });
  };

  const handleMouseUp = () => setDragItem(null);

  const generateAllBibs = async () => {
    if (!bgImage || filteredRunners.length === 0) return;
    setIsGenerating(true);
    setProgress(0);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bgImg = new Image();
    bgImg.src = bgImage;
    await new Promise(resolve => { bgImg.onload = resolve });
    canvas.width = imageSize.width;
    canvas.height = imageSize.height;
    const orientation = imageSize.width > imageSize.height ? 'l' : 'p';
    const pdf = new jsPDF({ orientation, unit: 'px', format: [imageSize.width, imageSize.height], compress: true });

    for (let i = 0; i < filteredRunners.length; i++) {
      const r = filteredRunners[i];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bgImg, 0, 0);
      ctx.textBaseline = 'top';
      ctx.font = `${bibStyle.fontWeight} ${bibStyle.fontSize}px ${bibStyle.fontFamily}`;
      ctx.fillStyle = bibStyle.color;
      ctx.fillText(r.bib, bibStyle.x, bibStyle.y);
      ctx.font = `${nameStyle.fontWeight} ${nameStyle.fontSize}px ${nameStyle.fontFamily}`;
      ctx.fillStyle = nameStyle.color;
      ctx.fillText(r.name, nameStyle.x, nameStyle.y);

      for (const t of customTexts) {
        let textToDraw = t.text.replace(/{BIB}/g, r.bib).replace(/{NAME}/g, r.name);
        if (t.type === 'qr') {
          try {
            const qrUrl = await QRCode.toDataURL(textToDraw, { margin: 1, width: Math.max(50, t.fontSize * 3) });
            const qrImg = new Image(); qrImg.src = qrUrl;
            await new Promise(res => { qrImg.onload = res });
            ctx.drawImage(qrImg, t.x, t.y);
          } catch(e) { console.error('QR Error', e) }
        } else if (t.type === 'barcode') {
          try {
            const c = document.createElement('canvas');
            JsBarcode(c, textToDraw, { margin: 0, displayValue: false, height: 100, width: 2 });
            ctx.drawImage(c, t.x, t.y, t.barcodeWidth || 150, t.barcodeHeight || 50);
          } catch(e) { console.error('Barcode Error', e) }
        } else {
          ctx.font = `${t.fontWeight} ${t.fontSize}px ${t.fontFamily}`;
          ctx.fillStyle = t.color;
          ctx.fillText(textToDraw, t.x, t.y);
        }
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      if (i > 0) pdf.addPage([imageSize.width, imageSize.height], orientation);
      pdf.addImage(imgData, 'JPEG', 0, 0, imageSize.width, imageSize.height);
      setProgress(Math.round(((i + 1) / filteredRunners.length) * 100));
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    pdf.save("Auto_BIBs.pdf");
    setIsGenerating(false);
    addToast(`✓ สร้าง BIB สำเร็จ ${filteredRunners.length} ไฟล์`);
  };

  /* ---- inline style helpers ---- */
  const tabBtn = (key, label, badge) => (
    <button
      key={key}
      onClick={() => setActiveTab(activeTab === key ? null : key)}
      style={{
        padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
        fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
        background: activeTab === key ? 'var(--ink)' : 'transparent',
        color: activeTab === key ? '#fff' : 'var(--ink-2)',
        transition: 'all .15s',
      }}
    >
      {label}
      {badge !== undefined && <span style={{ fontSize: '0.7rem', background: activeTab === key ? 'var(--primary)' : 'var(--border)', color: activeTab === key ? '#000' : 'var(--ink)', borderRadius: '10px', padding: '1px 7px' }}>{badge}</span>}
    </button>
  );

  const IL = ({ children }) => <label style={{ fontSize: '0.78rem', color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>{children}</label>;

  const fontOpts = [
    <option key="ss" value="sans-serif">Sans-Serif</option>,
    <option key="s" value="serif">Serif</option>,
    <option key="m" value="monospace">Monospace</option>,
    <option key="i" value="Inter">Inter</option>
  ];
  const weightOpts = [
    <option key="n" value="normal">Normal</option>,
    <option key="b" value="bold">Bold</option>,
    <option key="br" value="bolder">Bolder</option>,
    <option key="l" value="lighter">Lighter</option>
  ];

  const inpStyle = { padding: '5px 8px', minWidth: 0 };

  return (
    <div className="page active" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* ── Header row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <span className="eyebrow">Tools</span>
          <h1 style={{ margin: 0 }}>Auto BIB Generator</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {imageSize.width > 0 && <span style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>📐 {imageSize.width}×{imageSize.height}</span>}
          <label className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'var(--border)', color: 'var(--text)', margin: 0, padding: '8px 14px' }}>
            <Upload size={14} /> {bgImage ? 'เปลี่ยนรูป' : 'เลือกรูปพื้นหลัง'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
          </label>
          <button
            className="btn"
            style={{ background: 'var(--primary)', color: '#000', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
            onClick={generateAllBibs}
            disabled={!bgImage || isGenerating || filteredRunners.length === 0}
          >
            {isGenerating ? `กำลังสร้าง… ${progress}%` : <><Download size={14} /> Generate ({filteredRunners.length})</>}
          </button>
        </div>
      </div>

      {/* ── Progress ── */}
      {isGenerating && (
        <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', marginBottom: '10px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)', transition: 'width .2s' }} />
        </div>
      )}

      {/* ── Toolbar: tab buttons ── */}
      <div className="card" style={{ padding: '8px 12px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          {tabBtn('filters', '🔍 Filters', filteredRunners.length)}
          {tabBtn('bib', '🔢 BIB Number')}
          {tabBtn('name', '👤 Name')}
          {tabBtn('layers', '🧩 Layers', customTexts.length || undefined)}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--ink-2)' }}>💡 ลากข้อความบนรูปเพื่อจัดตำแหน่ง</span>
        </div>

        {/* ── Tab: Filters ── */}
        {activeTab === 'filters' && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'end', marginTop: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 160px', minWidth: '120px' }}>
              <IL>Category</IL>
              <select className="search" style={{ width: '100%', ...inpStyle }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="">ทั้งหมด</option>
                {availableCats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 120px', minWidth: '100px' }}>
              <IL>Gender</IL>
              <select className="search" style={{ width: '100%', ...inpStyle }} value={filterGender} onChange={e => setFilterGender(e.target.value)}>
                <option value="">ทั้งหมด</option>
                <option value="M">ชาย</option>
                <option value="F">หญิง</option>
              </select>
            </div>
            <div style={{ flex: '1 1 140px', minWidth: '100px' }}>
              <IL>Age Group</IL>
              <select className="search" style={{ width: '100%', ...inpStyle }} value={filterAge} onChange={e => setFilterAge(e.target.value)}>
                <option value="">ทั้งหมด</option>
                {availableAges.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── Tab: BIB Style ── */}
        {activeTab === 'bib' && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'end', marginTop: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 80px' }}>
              <IL>Size (px)</IL>
              <input type="number" className="search" style={{ width: '100%', ...inpStyle }} value={bibStyle.fontSize} onChange={e => setBibStyle({ ...bibStyle, fontSize: Number(e.target.value) })} />
            </div>
            <div style={{ flex: '0 0 50px' }}>
              <IL>Color</IL>
              <input type="color" style={{ width: '100%', height: '32px', border: '2px solid var(--border)', borderRadius: '6px', padding: 0, cursor: 'pointer' }} value={bibStyle.color} onChange={e => setBibStyle({ ...bibStyle, color: e.target.value })} />
            </div>
            <div style={{ flex: '1 1 120px', minWidth: '100px' }}>
              <IL>Font</IL>
              <select className="search" style={{ width: '100%', ...inpStyle }} value={bibStyle.fontFamily} onChange={e => setBibStyle({ ...bibStyle, fontFamily: e.target.value })}>{fontOpts}</select>
            </div>
            <div style={{ flex: '1 1 100px', minWidth: '80px' }}>
              <IL>Weight</IL>
              <select className="search" style={{ width: '100%', ...inpStyle }} value={bibStyle.fontWeight} onChange={e => setBibStyle({ ...bibStyle, fontWeight: e.target.value })}>{weightOpts}</select>
            </div>
          </div>
        )}

        {/* ── Tab: Name Style ── */}
        {activeTab === 'name' && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'end', marginTop: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 80px' }}>
              <IL>Size (px)</IL>
              <input type="number" className="search" style={{ width: '100%', ...inpStyle }} value={nameStyle.fontSize} onChange={e => setNameStyle({ ...nameStyle, fontSize: Number(e.target.value) })} />
            </div>
            <div style={{ flex: '0 0 50px' }}>
              <IL>Color</IL>
              <input type="color" style={{ width: '100%', height: '32px', border: '2px solid var(--border)', borderRadius: '6px', padding: 0, cursor: 'pointer' }} value={nameStyle.color} onChange={e => setNameStyle({ ...nameStyle, color: e.target.value })} />
            </div>
            <div style={{ flex: '1 1 120px', minWidth: '100px' }}>
              <IL>Font</IL>
              <select className="search" style={{ width: '100%', ...inpStyle }} value={nameStyle.fontFamily} onChange={e => setNameStyle({ ...nameStyle, fontFamily: e.target.value })}>{fontOpts}</select>
            </div>
            <div style={{ flex: '1 1 100px', minWidth: '80px' }}>
              <IL>Weight</IL>
              <select className="search" style={{ width: '100%', ...inpStyle }} value={nameStyle.fontWeight} onChange={e => setNameStyle({ ...nameStyle, fontWeight: e.target.value })}>{weightOpts}</select>
            </div>
          </div>
        )}

        {/* ── Tab: Layers ── */}
        {activeTab === 'layers' && (
          <div style={{ marginTop: '10px' }}>
            {customTexts.map((t, idx) => (
              <div key={t.id} style={{ display: 'flex', gap: '8px', alignItems: 'end', padding: '8px', background: 'var(--bg-soft)', borderRadius: '8px', marginBottom: '6px', flexWrap: 'wrap', border: '1px solid var(--border)' }}>
                <div style={{ flex: '0 0 90px' }}>
                  <IL>Type</IL>
                  <select className="search" style={{ width: '100%', ...inpStyle }} value={t.type} onChange={e => updateCustomText(t.id, { type: e.target.value })}>
                    <option value="text">Text</option>
                    <option value="qr">QR</option>
                    <option value="barcode">Barcode</option>
                  </select>
                </div>
                <div style={{ flex: '1 1 180px', minWidth: '120px' }}>
                  <IL>Content</IL>
                  <input type="text" className="search" style={{ width: '100%', ...inpStyle }} value={t.text} onChange={e => updateCustomText(t.id, { text: e.target.value })} placeholder="{BIB} or {NAME}" />
                </div>
                {t.type === 'barcode' ? (
                  <>
                    <div style={{ flex: '0 0 60px' }}>
                      <IL>W</IL>
                      <input type="number" className="search" style={{ width: '100%', ...inpStyle }} value={t.barcodeWidth || 150} onChange={e => updateCustomText(t.id, { barcodeWidth: Number(e.target.value) })} />
                    </div>
                    <div style={{ flex: '0 0 60px' }}>
                      <IL>H</IL>
                      <input type="number" className="search" style={{ width: '100%', ...inpStyle }} value={t.barcodeHeight || 50} onChange={e => updateCustomText(t.id, { barcodeHeight: Number(e.target.value) })} />
                    </div>
                  </>
                ) : (
                  <div style={{ flex: '0 0 65px' }}>
                    <IL>Size</IL>
                    <input type="number" className="search" style={{ width: '100%', ...inpStyle }} value={t.fontSize} onChange={e => updateCustomText(t.id, { fontSize: Number(e.target.value) })} />
                  </div>
                )}
                {t.type === 'text' && (
                  <>
                    <div style={{ flex: '0 0 90px' }}>
                      <IL>Font</IL>
                      <select className="search" style={{ width: '100%', ...inpStyle }} value={t.fontFamily} onChange={e => updateCustomText(t.id, { fontFamily: e.target.value })}>{fontOpts}</select>
                    </div>
                    <div style={{ flex: '0 0 80px' }}>
                      <IL>Weight</IL>
                      <select className="search" style={{ width: '100%', ...inpStyle }} value={t.fontWeight} onChange={e => updateCustomText(t.id, { fontWeight: e.target.value })}>{weightOpts}</select>
                    </div>
                    <div style={{ flex: '0 0 36px' }}>
                      <IL>Color</IL>
                      <input type="color" style={{ width: '32px', height: '32px', border: '2px solid var(--border)', borderRadius: '6px', padding: 0, cursor: 'pointer' }} value={t.color} onChange={e => updateCustomText(t.id, { color: e.target.value })} />
                    </div>
                  </>
                )}
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--warn)', fontSize: '0.8rem', cursor: 'pointer', padding: '4px 8px', alignSelf: 'center' }}
                  onClick={() => removeCustomText(t.id)}
                >✕</button>
              </div>
            ))}
            <button className="btn" style={{ background: 'var(--bg-soft)', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px' }} onClick={addCustomText}>
              <Plus size={14} /> เพิ่ม Layer
            </button>
          </div>
        )}
      </div>

      {/* ── Preview (full width) ── */}
      <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', overflow: 'hidden', position: 'relative', height: 'calc(100vh - 260px)', minHeight: '300px' }}>
        {!bgImage ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
            <ImageIcon size={56} style={{ opacity: 0.2, margin: '0 auto 12px' }} />
            <p style={{ marginBottom: '10px', fontSize: '0.95rem' }}>กรุณาอัพโหลดรูปพื้นหลัง BIB</p>
            <label className="btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={15} /> เลือกรูป
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </label>
          </div>
        ) : (
          <div
            ref={previewRef}
            style={{ position: 'relative', maxHeight: '100%', maxWidth: '100%', display: 'inline-block', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden' }}
          >
            <img
              ref={imgRef} src={bgImage} alt="BIB Background"
              onLoad={() => { if (imgRef.current && imageSize.width > 0) setScale(imgRef.current.clientWidth / imageSize.width); }}
              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
            />

            <div onMouseDown={e => handleMouseDown(e, 'bib')} style={{
              position: 'absolute', top: 0, left: 0,
              transform: `translate(${bibStyle.x * scale}px, ${bibStyle.y * scale}px)`,
              fontFamily: bibStyle.fontFamily, fontSize: `${bibStyle.fontSize * scale}px`,
              fontWeight: bibStyle.fontWeight, color: bibStyle.color,
              cursor: dragItem === 'bib' ? 'grabbing' : 'grab',
              userSelect: 'none', whiteSpace: 'nowrap', transformOrigin: 'top left', lineHeight: 1,
            }}>9999</div>

            <div onMouseDown={e => handleMouseDown(e, 'name')} style={{
              position: 'absolute', top: 0, left: 0,
              transform: `translate(${nameStyle.x * scale}px, ${nameStyle.y * scale}px)`,
              fontFamily: nameStyle.fontFamily, fontSize: `${nameStyle.fontSize * scale}px`,
              fontWeight: nameStyle.fontWeight, color: nameStyle.color,
              cursor: dragItem === 'name' ? 'grabbing' : 'grab',
              userSelect: 'none', whiteSpace: 'nowrap', transformOrigin: 'top left', lineHeight: 1,
            }}>Somchai Jaidee</div>

            {customTexts.map(t => (
              <PreviewElement key={t.id} item={t} scale={scale}
                onMouseDown={e => handleMouseDown(e, `custom-${t.id}`)} dragItem={dragItem}
              />
            ))}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

