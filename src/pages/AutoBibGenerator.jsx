import { useState, useRef, useEffect, useMemo } from 'react';
import { useRace } from '../context/RaceContext';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { Upload, Download, Image as ImageIcon, Filter } from 'lucide-react';

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

  const [bibStyle, setBibStyle] = useState({
    x: 50,
    y: 50,
    fontSize: 100,
    color: '#000000',
    fontWeight: 'bold',
    fontFamily: 'Inter'
  });

  const [nameStyle, setNameStyle] = useState({
    x: 50,
    y: 200,
    fontSize: 40,
    color: '#333333',
    fontWeight: 'normal',
    fontFamily: 'Inter'
  });

  const previewRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const [dragItem, setDragItem] = useState(null);

  // Dynamic filter options
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

  const handleMouseDown = (e, item) => {
    e.preventDefault();
    setDragItem(item);
  };

  const handleMouseMove = (e) => {
    if (!dragItem || !previewRef.current || !imgRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const currentScale = imageSize.width / imgRef.current.clientWidth;

    let x = (e.clientX - rect.left) * currentScale;
    let y = (e.clientY - rect.top) * currentScale;

    if (dragItem === 'bib') {
      setBibStyle(prev => ({ ...prev, x, y }));
    } else if (dragItem === 'name') {
      setNameStyle(prev => ({ ...prev, x, y }));
    }
  };

  const handleMouseUp = () => {
    setDragItem(null);
  };

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

    // Create jsPDF instance (using 'px' units and setting page size to match image pixels)
    const orientation = imageSize.width > imageSize.height ? 'l' : 'p';
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'px',
      format: [imageSize.width, imageSize.height],
      compress: true
    });

    for (let i = 0; i < filteredRunners.length; i++) {
      const r = filteredRunners[i];
      // Draw background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bgImg, 0, 0);

      // Draw BIB
      ctx.textBaseline = 'top';
      ctx.font = `${bibStyle.fontWeight} ${bibStyle.fontSize}px ${bibStyle.fontFamily}`;
      ctx.fillStyle = bibStyle.color;
      ctx.fillText(r.bib, bibStyle.x, bibStyle.y);

      // Draw Name
      ctx.font = `${nameStyle.fontWeight} ${nameStyle.fontSize}px ${nameStyle.fontFamily}`;
      ctx.fillStyle = nameStyle.color;
      ctx.fillText(r.name, nameStyle.x, nameStyle.y);

      // Convert to DataURL for jsPDF
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      
      // Add page to PDF (except for the very first one which is already created empty)
      if (i > 0) {
        pdf.addPage([imageSize.width, imageSize.height], orientation);
      }
      pdf.addImage(imgData, 'JPEG', 0, 0, imageSize.width, imageSize.height);

      setProgress(Math.round(((i + 1) / filteredRunners.length) * 100));
      // Small delay for UI thread
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    pdf.save("Auto_BIBs.pdf");
    
    setIsGenerating(false);
    addToast(`✓ สร้าง BIB สำเร็จ ${filteredRunners.length} ไฟล์`);
  };

  return (
    <div className="page active" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="eyebrow">Tools</span>
          <h1>Auto BIB Generator</h1>
          <p>อัพโหลดรูปพื้นหลัง ปรับแต่งตำแหน่ง และกรองข้อมูลนักวิ่งเพื่อสร้าง BIB อัตโนมัติ</p>
        </div>
        <button 
          className="btn" 
          style={{ background: 'var(--primary)', color: 'black', display: 'flex', alignItems: 'center', gap: '8px' }} 
          onClick={generateAllBibs}
          disabled={!bgImage || isGenerating || filteredRunners.length === 0}
        >
          {isGenerating ? `Generating... ${progress}%` : <><Download size={16} /> Generate PDF</>}
        </button>
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
            
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
              Found: {filteredRunners.length} runners
            </div>
          </div>

          <h3>Settings</h3>
          
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Background Image</label>
            <label className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'var(--border)', color: 'var(--text)' }}>
              <Upload size={16} /> Choose Image
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </label>
            {imageSize.width > 0 && <span style={{marginLeft: '1rem', fontSize: '0.8rem', color: 'var(--muted)'}}>{imageSize.width} x {imageSize.height}px</span>}
          </div>

          <hr style={{ margin: '1.5rem 0', borderColor: 'var(--border)' }} />

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>BIB Number Style</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label>Font Size (px)</label>
                <input type="number" className="search" style={{ width: '100%', marginTop: '0.25rem' }} value={bibStyle.fontSize} onChange={e => setBibStyle({...bibStyle, fontSize: Number(e.target.value)})} />
              </div>
              <div>
                <label>Color</label>
                <input type="color" style={{ width: '100%', height: '36px', marginTop: '0.25rem', border: 'none', background: 'none', padding: 0 }} value={bibStyle.color} onChange={e => setBibStyle({...bibStyle, color: e.target.value})} />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label>Font Family</label>
                <select className="search" style={{ width: '100%', marginTop: '0.25rem' }} value={bibStyle.fontFamily} onChange={e => setBibStyle({...bibStyle, fontFamily: e.target.value})}>
                  <option value="sans-serif">Sans-Serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="Inter">Inter</option>
                </select>
            </div>
          </div>

          <hr style={{ margin: '1.5rem 0', borderColor: 'var(--border)' }} />

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Name Style</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label>Font Size (px)</label>
                <input type="number" className="search" style={{ width: '100%', marginTop: '0.25rem' }} value={nameStyle.fontSize} onChange={e => setNameStyle({...nameStyle, fontSize: Number(e.target.value)})} />
              </div>
              <div>
                <label>Color</label>
                <input type="color" style={{ width: '100%', height: '36px', marginTop: '0.25rem', border: 'none', background: 'none', padding: 0 }} value={nameStyle.color} onChange={e => setNameStyle({...nameStyle, color: e.target.value})} />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label>Font Family</label>
                <select className="search" style={{ width: '100%', marginTop: '0.25rem' }} value={nameStyle.fontFamily} onChange={e => setNameStyle({...nameStyle, fontFamily: e.target.value})}>
                  <option value="sans-serif">Sans-Serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="Inter">Inter</option>
                </select>
            </div>
          </div>

          <hr style={{ margin: '1.5rem 0', borderColor: 'var(--border)' }} />

        </div>

        {/* Right Preview */}
        <div className="preview-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', overflow: 'hidden', position: 'relative' }}>
            {!bgImage ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
                <ImageIcon size={48} style={{ opacity: 0.3, marginBottom: '1rem', margin: '0 auto' }} />
                <p>Please upload a background image</p>
              </div>
            ) : (
              <div 
                ref={previewRef}
                style={{
                  position: 'relative',
                  maxHeight: '100%',
                  maxWidth: '100%',
                  display: 'inline-block',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  overflow: 'hidden'
                }}
              >
                <img 
                  ref={imgRef}
                  src={bgImage} 
                  alt="BIB Background" 
                  onLoad={() => {
                    if (imgRef.current && imageSize.width > 0) setScale(imgRef.current.clientWidth / imageSize.width);
                  }}
                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', display: 'block' }} 
                />
                
                <div
                  onMouseDown={(e) => handleMouseDown(e, 'bib')}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    transform: `translate(${bibStyle.x * scale}px, ${bibStyle.y * scale}px)`,
                    fontFamily: bibStyle.fontFamily,
                    fontSize: `${bibStyle.fontSize * scale}px`,
                    fontWeight: bibStyle.fontWeight,
                    color: bibStyle.color,
                    cursor: dragItem === 'bib' ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    transformOrigin: 'top left',
                    lineHeight: 1,
                  }}
                >
                  9999
                </div>

                <div
                  onMouseDown={(e) => handleMouseDown(e, 'name')}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    transform: `translate(${nameStyle.x * scale}px, ${nameStyle.y * scale}px)`,
                    fontFamily: nameStyle.fontFamily,
                    fontSize: `${nameStyle.fontSize * scale}px`,
                    fontWeight: nameStyle.fontWeight,
                    color: nameStyle.color,
                    cursor: dragItem === 'name' ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    transformOrigin: 'top left',
                    lineHeight: 1,
                  }}
                >
                  Somchai Jaidee
                </div>
              </div>
            )}
          </div>
          <p style={{ marginTop: '1rem', color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center' }}>
            Hint: Click and drag the text to position it. The positions will apply to all generated BIBs.
          </p>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
