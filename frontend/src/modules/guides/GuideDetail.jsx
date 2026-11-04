import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import SEO from '../../components/SEO';
import { GUIDES } from './guidesData';
import { FaArrowLeft, FaClock, FaCalendarAlt, FaCheckCircle, FaCreditCard, FaMoneyBillWave } from 'react-icons/fa';

export default function GuideDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { C, isDark } = useTheme();

  const guide = GUIDES.find((g) => g.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!guide) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', padding: '60px 16px', textAlign: 'center', color: C.text }}>
        <h2>Guide Not Found</h2>
        <p>The requested guide does not exist.</p>
        <Link to="/guides" style={{ color: C.teal, fontWeight: 700 }}>Back to Guides</Link>
      </div>
    );
  }

  // Schema.org FAQPage structured data
  const faqSchema = guide.faqs && guide.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": guide.faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  } : null;

  return (
    <>
      <SEO />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      <div style={{ background: C.bg, minHeight: '100vh', padding: '30px 16px 80px', color: C.text, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          {/* Back Link */}
          <div style={{ marginBottom: '24px' }}>
            <Link
              to="/guides"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: C.teal,
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <FaArrowLeft size={12} /> All Financial Guides
            </Link>
          </div>

          {/* Article Header */}
          <header style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: C.teal, background: `${C.teal}18`, padding: '4px 10px', borderRadius: '6px' }}>
                {guide.category}
              </span>
              <span style={{ fontSize: '13px', color: C.textLight, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FaClock size={12} /> {guide.readTime}
              </span>
              <span style={{ fontSize: '13px', color: C.textLight, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FaCalendarAlt size={12} /> Updated: {guide.publishedAt}
              </span>
            </div>

            <h1 style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1.3, margin: '0 0 16px', color: C.text }}>
              {guide.title}
            </h1>

            <p style={{ fontSize: '16px', color: C.textSecondary, lineHeight: 1.7, margin: 0, borderLeft: `3px solid ${C.teal}`, paddingLeft: '16px' }}>
              {guide.summary}
            </p>
          </header>

          {/* Article Body */}
          <main style={{ background: C.bgSecondary, padding: '32px', borderRadius: '20px', border: `1px solid ${C.border}`, marginBottom: '36px' }}>
            {guide.content.map((sec, idx) => (
              <section key={idx} style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 14px', color: C.text }}>
                  {sec.heading}
                </h2>

                {sec.text && (
                  <p style={{ fontSize: '15px', lineHeight: 1.8, color: C.textSecondary, margin: '0 0 16px' }}>
                    {sec.text}
                  </p>
                )}

                {sec.list && (
                  <ul style={{ paddingLeft: '20px', margin: '0 0 16px', lineHeight: 1.8, color: C.textSecondary, fontSize: '15px' }}>
                    {sec.list.map((item, liIdx) => (
                      <li key={liIdx} style={{ marginBottom: '8px' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {sec.table && (
                  <div style={{ overflowX: 'auto', margin: '20px 0', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                          {sec.table.headers.map((th, thIdx) => (
                            <th key={thIdx} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, color: C.text, borderBottom: `1px solid ${C.border}` }}>
                              {th}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sec.table.rows.map((row, rIdx) => (
                          <tr key={rIdx} style={{ borderBottom: rIdx === sec.table.rows.length - 1 ? 'none' : `1px solid ${C.border}` }}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} style={{ padding: '12px 14px', color: cIdx === 0 ? C.text : C.textSecondary, fontWeight: cIdx === 0 ? 700 : 400 }}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}

            {/* FAQs */}
            {guide.faqs && guide.faqs.length > 0 && (
              <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '28px', marginTop: '28px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 20px', color: C.text }}>
                  Frequently Asked Questions (FAQs)
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {guide.faqs.map((f, fIdx) => (
                    <div key={fIdx} style={{ background: C.bg, padding: '16px 20px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 8px', color: C.text }}>
                        {f.q}
                      </h3>
                      <p style={{ fontSize: '14px', color: C.textSecondary, margin: 0, lineHeight: 1.6 }}>
                        {f.a}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Call to Action Box */}
          <div style={{ background: `linear-gradient(135deg, ${C.teal} 0%, #0d5f57 100%)`, color: '#ffffff', padding: '32px', borderRadius: '20px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 10px' }}>
              Ready to Explore Offers on GharKaPaisa?
            </h3>
            <p style={{ fontSize: '15px', opacity: 0.9, maxWidth: '600px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Compare verified credit cards and loan offers tailored to your profile. 100% digital process with quick sanction.
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/credit-cards')}
                style={{
                  background: '#ffffff',
                  color: C.teal,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FaCreditCard /> Compare Credit Cards
              </button>
              <button
                onClick={() => navigate('/loans')}
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FaMoneyBillWave /> Explore Personal Loans
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
