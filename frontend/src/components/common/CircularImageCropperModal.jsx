import React, { useState, useRef, useEffect } from 'react';
import { MdZoomIn, MdZoomOut, MdRotateRight, MdCheck, MdClose, MdCrop } from 'react-icons/md';

export default function CircularImageCropperModal({ imageSource, onClose, onCropSave, title = "Crop Profile Photo" }) {
  const [imageObj, setImageObj] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);

  // Load image object when imageSource changes
  useEffect(() => {
    if (!imageSource) return;

    let srcUrl = '';
    if (typeof imageSource === 'string') {
      srcUrl = imageSource;
    } else if (imageSource instanceof File || imageSource instanceof Blob) {
      srcUrl = URL.createObjectURL(imageSource);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    };
    img.src = srcUrl;

    return () => {
      if (imageSource instanceof File || imageSource instanceof Blob) {
        URL.revokeObjectURL(srcUrl);
      }
    };
  }, [imageSource]);

  // Handle Mouse / Touch Dragging
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Generate Circular Cropped Canvas Data URL
  const handleCropAndSave = () => {
    if (!imageObj) return;

    const outputSize = 400; // 400x400 crisp high resolution circular crop
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.clearRect(0, 0, outputSize, outputSize);

    // Create Circular Mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    // Center coordinates
    const centerX = outputSize / 2;
    const centerY = outputSize / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    // Calculate scaling to fit circular window
    const cropSizeOnScreen = 240; // Diameter of cropper circle on UI
    const scaleFactor = outputSize / cropSizeOnScreen;

    // Draw scaled & panned image
    const drawWidth = imageObj.width * zoom * scaleFactor;
    const drawHeight = imageObj.height * zoom * scaleFactor;
    const drawX = position.x * scaleFactor - drawWidth / 2;
    const drawY = position.y * scaleFactor - drawHeight / 2;

    ctx.drawImage(imageObj, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();

    const croppedDataUrl = canvas.toDataURL('image/png', 0.95);
    
    // Convert Data URL to Blob for file uploads if needed
    canvas.toBlob((blob) => {
      onCropSave(croppedDataUrl, blob);
    }, 'image/png', 0.95);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '460px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif"
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 24px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC'
        }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdCrop style={{ color: '#0F766E', fontSize: '20px' }} />
            {title}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', padding: '4px' }}>
            <MdClose size={22} />
          </button>
        </div>

        {/* Cropping Canvas Viewport */}
        <div 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          style={{
            position: 'relative', width: '100%', height: '320px', background: '#0F172A',
            overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {imageObj && (
            <img
              src={imageObj.src}
              alt="Crop target"
              draggable={false}
              style={{
                position: 'absolute',
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                maxWidth: 'none',
                pointerEvents: 'none',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
            />
          )}

          {/* Dark Overlay with Circular Cutout */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle 120px at center, transparent 100%, rgba(15, 23, 42, 0.75) 100.5%)',
            pointerEvents: 'none'
          }} />

          {/* Circular Border Ring Accent */}
          <div style={{
            position: 'absolute', width: '240px', height: '240px', borderRadius: '50%',
            border: '2px dashed #38BDF8', boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.45)',
            pointerEvents: 'none'
          }} />

          <span style={{
            position: 'absolute', bottom: '12px', background: 'rgba(0,0,0,0.6)',
            color: '#F8FAFC', fontSize: '11px', fontWeight: 600, padding: '4px 12px',
            borderRadius: '20px', pointerEvents: 'none'
          }}>
            Drag & positioning inside the circle
          </span>
        </div>

        {/* Controls Toolbar */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#FFF' }}>
          
          {/* Zoom Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MdZoomOut size={20} style={{ color: '#64748B' }} />
            <input
              type="range"
              min="0.5"
              max="3.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: '#0F766E', cursor: 'pointer' }}
            />
            <MdZoomIn size={20} style={{ color: '#64748B' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', minWidth: '36px', textAlign: 'right' }}>
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px',
                borderRadius: '10px', border: '1px solid #CBD5E1', background: '#F8FAFC',
                color: '#334155', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <MdRotateRight size={18} />
              <span>Rotate 90°</span>
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '9px 16px', borderRadius: '10px', border: '1px solid #CBD5E1',
                  background: '#FFF', color: '#475569', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCropAndSave}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px',
                  borderRadius: '10px', border: 'none', background: '#0F766E',
                  color: '#FFF', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)'
                }}
              >
                <MdCheck size={18} />
                <span>Crop & Save Photo</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
