import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function AttendanceTips() {
  const tips = [
    'Be in a well-lit environment',
    'Look directly at the camera',
    'Keep your face inside the frame',
    'Remove sunglasses or face covering',
    'Keep the camera steady'
  ];

  return (
    <div style={{
      background: '#F0FDF4',
      border: '1px solid #DCFCE7',
      borderRadius: '14px',
      padding: '14px 16px',
      marginTop: 'auto'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        fontWeight: 700,
        color: '#16A34A',
        marginBottom: '6px'
      }}>
        <CheckCircle2 size={16} /> Tips for best results
      </div>

      <ul style={{
        margin: 0,
        paddingLeft: '16px',
        fontSize: '12px',
        color: '#374151',
        lineHeight: 1.55
      }}>
        {tips.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
