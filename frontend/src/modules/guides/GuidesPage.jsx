import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import SEO from '../../components/SEO';
import { GUIDES } from './guidesData';
import { FaBookOpen, FaClock, FaCalendarAlt, FaArrowRight, FaSearch } from 'react-icons/fa';

export default function GuidesPage() {
  const { C, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  const categories = ['ALL', 'Credit Cards', 'Loans', 'Personal Finance'];

  const filteredGuides = GUIDES.filter((guide) => {
    const matchesCategory = selectedCategory === 'ALL' || guide.category === selectedCategory;
    const matchesSearch =
      !search ||
      guide.title.toLowerCase().includes(search.toLowerCase()) ||
      guide.summary.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <SEO />
      <div style={{ background: C.bg, minHeight: '100vh', padding: '40px 16px 80px', color: C.text, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ display: 'inline-block', background: `${C.teal}18`, color: C.teal, padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 800, marginBottom: '12px' }}>
              Knowledge Hub & Expert Guides
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 12px', color: C.text }}>
              GharKaPaisa Financial Knowledge & Guides
            </h1>
            <p style={{ fontSize: '16px', color: C.textSecondary, maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
              In-depth, accurate, and easy-to-understand guides on credit cards, personal loans, CIBIL scores, and financial planning in India.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px', background: C.bgSecondary, padding: '16px 20px', borderRadius: '16px', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    background: selectedCategory === cat ? C.teal : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    color: selectedCategory === cat ? '#ffffff' : C.text,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {cat === 'ALL' ? 'All Guides' : cat}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
              <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight, fontSize: '14px' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics, cards, loans..."
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '10px',
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  color: C.text,
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Guides Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {filteredGuides.map((guide) => (
              <article
                key={guide.slug}
                style={{
                  background: C.bgSecondary,
                  borderRadius: '18px',
                  border: `1px solid ${C.border}`,
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: C.teal, background: `${C.teal}15`, padding: '4px 10px', borderRadius: '6px' }}>
                      {guide.badge || guide.category}
                    </span>
                    <span style={{ fontSize: '12px', color: C.textLight, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FaClock size={11} /> {guide.readTime}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 10px', color: C.text, lineHeight: 1.4 }}>
                    <Link to={`/guides/${guide.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {guide.title}
                    </Link>
                  </h2>

                  <p style={{ fontSize: '14px', color: C.textSecondary, lineHeight: 1.6, margin: '0 0 20px' }}>
                    {guide.summary}
                  </p>
                </div>

                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: C.textLight, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FaCalendarAlt size={11} /> {guide.publishedAt}
                  </span>
                  <Link
                    to={`/guides/${guide.slug}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: C.teal,
                      fontSize: '13px',
                      fontWeight: 800,
                      textDecoration: 'none',
                    }}
                  >
                    Read Full Guide <FaArrowRight size={11} />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {filteredGuides.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textSecondary }}>
              <FaBookOpen size={36} style={{ color: C.textLight, marginBottom: '12px' }} />
              <h3>No guides found matching your search.</h3>
              <p>Try searching for credit card, personal loan, or CIBIL score.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
