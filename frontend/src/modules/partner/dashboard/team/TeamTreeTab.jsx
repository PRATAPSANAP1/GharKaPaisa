import React, { useState, useEffect } from 'react';
import {
  ChevronRight, ChevronDown, User, Layers, RefreshCw, Eye
} from 'lucide-react';
import { useTheme } from '../../../../contexts/ThemeContext';
import api from '../../../../services/api';

export default function TeamTreeTab({ onSelectMember }) {
  const { C, isDark } = useTheme();
  const border = isDark ? '#1f1f1f' : C.border;
  const cardBg = isDark ? '#0f0f0f' : '#fff';
  const textPrimary = C.text;
  const textMuted = C.textMid;
  const accent = C.primary;

  const [rootNode, setRootNode] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [childrenMap, setChildrenMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchRootTree(); }, []);

  const fetchRootTree = async () => {
    setInitialLoading(true); setError(null);
    try {
      const res = await api.get('/team/tree');
      if (res.data?.success) {
        const root = res.data.root;
        const children = res.data.data || [];
        setRootNode(root);
        if (root) {
          setChildrenMap(p => ({ ...p, [root.id]: children }));
          setExpandedNodes(p => ({ ...p, [root.id]: true }));
        }
      }
    } catch (err) { setError(err.response?.data?.message || 'Failed to load team hierarchy'); }
    finally { setInitialLoading(false); }
  };

  const toggleNode = async (nodeId) => {
    if (expandedNodes[nodeId]) { setExpandedNodes(p => ({ ...p, [nodeId]: false })); return; }
    setExpandedNodes(p => ({ ...p, [nodeId]: true }));
    if (!childrenMap[nodeId]) {
      setLoadingMap(p => ({ ...p, [nodeId]: true }));
      try {
        const res = await api.get(`/team/tree?parent_id=${nodeId}`);
        if (res.data?.success) setChildrenMap(p => ({ ...p, [nodeId]: res.data.data || [] }));
      } catch { /* silent */ }
      finally { setLoadingMap(p => ({ ...p, [nodeId]: false })); }
    }
  };

  const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

  const TreeNode = ({ node, level = 0 }) => {
    const isExpanded = !!expandedNodes[node.id];
    const isLoading = !!loadingMap[node.id];
    const children = childrenMap[node.id] || [];
    const levelColors = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#a855f7', '#ef4444'];
    const lc = levelColors[level % levelColors.length];

    return (
      <div style={{ position: 'relative', paddingLeft: 28, marginTop: 10 }}>
        {/* Connector lines */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: `${lc}30`, borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: 0, top: 28, width: 28, height: 2, background: `${lc}30` }} />

        {/* Node Card */}
        <div style={{
          padding: '12px 16px', borderRadius: 14,
          background: isDark ? `linear-gradient(135deg,#0f0f0f,${lc}06)` : `linear-gradient(135deg,#fff,${lc}06)`,
          border: `1px solid ${lc}25`,
          boxShadow: isDark ? `0 2px 16px rgba(0,0,0,0.3)` : `0 2px 12px ${lc}10`,
          transition: 'all 0.25s',
          animation: 'nodeIn 0.3s ease both'
        }}>
          <style>{`@keyframes nodeIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }`}</style>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {node.has_children ? (
                <button onClick={() => toggleNode(node.id)} disabled={isLoading}
                  style={{ padding: 6, borderRadius: 8, border: `1px solid ${lc}30`, background: lc + '15', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                  {isLoading ? <RefreshCw size={13} color={lc} className="animate-spin" /> : isExpanded ? <ChevronDown size={13} color={lc} /> : <ChevronRight size={13} color={lc} />}
                </button>
              ) : (
                <div style={{ width: 28, height: 28, borderRadius: 8, background: isDark ? '#1a1a1a' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={13} color={textMuted} />
                </div>
              )}

              <div style={{ width: 38, height: 38, borderRadius: '50%', background: lc + '15', border: `2px solid ${lc}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: lc, overflow: 'hidden', fontSize: 12, flexShrink: 0 }}>
                {node.profile_photo_url ? <img src={node.profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (node.full_name || node.first_name || 'P').slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span onClick={() => onSelectMember(node.id)} style={{ fontWeight: 800, color: textPrimary, fontSize: 13, cursor: 'pointer' }}>
                    {node.full_name || `${node.first_name || ''} ${node.last_name || ''}`}
                  </span>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: lc + '15', color: lc, border: `1px solid ${lc}25`, fontWeight: 700 }}>{node.rank || 'Partner'}</span>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: isDark ? '#1a1a1a' : '#f1f5f9', color: textMuted, fontWeight: 700 }}>L{level}</span>
                </div>
                <div style={{ fontSize: 11, color: textMuted }}>Code: {node.partner_code}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: textMuted }}>Business</div>
                <div style={{ fontWeight: 800, color: '#10b981', fontSize: 13 }}>{fmt(node.business)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: textMuted }}>Recruits</div>
                <div style={{ fontWeight: 800, color: lc, fontSize: 13 }}>{node.direct_children_count}</div>
              </div>
              <button onClick={() => onSelectMember(node.id)}
                style={{ padding: 8, borderRadius: 10, border: `1px solid ${border}`, background: isDark ? '#1a1a1a' : '#f1f5f9', cursor: 'pointer', transition: 'all 0.2s', color: textMuted }}>
                <Eye size={14} />
              </button>
            </div>
          </div>
        </div>

        {isExpanded && children.length > 0 && (
          <div style={{ marginTop: 4 }}>
            {children.map(child => <TreeNode key={child.id} node={child} level={level + 1} />)}
          </div>
        )}
        {isExpanded && children.length === 0 && !isLoading && (
          <div style={{ paddingLeft: 16, paddingTop: 8, fontSize: 11, color: textMuted, fontStyle: 'italic' }}>No direct sub-members</div>
        )}
      </div>
    );
  };

  if (initialLoading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', background: cardBg, border: `1px solid ${border}`, borderRadius: 18 }}>
        <RefreshCw size={32} color={accent} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: textMuted, fontSize: 14 }}>Building team hierarchy tree...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: cardBg, border: '1px solid #ef444430', borderRadius: 18 }}>
        <p style={{ color: '#ef4444', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{error}</p>
        <button onClick={fetchRootTree} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: '#ef444420', color: '#ef4444', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderRadius: 18, marginBottom: 14, background: cardBg, border: `1px solid ${border}`, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={16} color={accent} /> Interactive Team Tree
          </h3>
          <p style={{ fontSize: 12, color: textMuted, margin: '3px 0 0' }}>Expand nodes to inspect downline teams lazily</p>
        </div>
        <button onClick={fetchRootTree}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: `1px solid ${border}`, background: isDark ? '#1a1a1a' : '#f8faff', color: textPrimary, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
          <RefreshCw size={13} /> Reload
        </button>
      </div>

      {/* Tree */}
      <div style={{ padding: '20px 16px', borderRadius: 18, background: isDark ? '#050505' : '#f8faff', border: `1px solid ${border}`, minHeight: 400, overflowX: 'auto', boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)' }}>
        {rootNode ? (
          <div style={{ minWidth: 560 }}>
            {/* Root Card */}
            <div style={{
              padding: '18px 20px', borderRadius: 18, marginBottom: 16,
              background: isDark ? `linear-gradient(135deg,#0d0d1a,#0f0f0f)` : `linear-gradient(135deg,#f0f4ff,#fff)`,
              border: `2px solid ${accent}30`,
              boxShadow: isDark ? `0 8px 32px rgba(0,0,0,0.5)` : `0 8px 32px ${accent}15`
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: accent + '20', border: `2px solid ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: accent, overflow: 'hidden', fontSize: 16 }}>
                    {rootNode.profile_photo_url ? <img src={rootNode.profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : rootNode.full_name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 900, color: textPrimary, fontSize: 16 }}>{rootNode.full_name}</span>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: accent + '20', color: accent, border: `1px solid ${accent}30`, fontWeight: 700 }}>{rootNode.rank || 'Partner (You)'}</span>
                    </div>
                    <div style={{ fontSize: 12, color: textMuted }}>Code: {rootNode.partner_code}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: textMuted }}>Total Team Business</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>{fmt(rootNode.business)}</div>
                </div>
              </div>
            </div>

            {childrenMap[rootNode.id]?.length > 0 ? (
              childrenMap[rootNode.id].map(child => <TreeNode key={child.id} node={child} level={1} />)
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: textMuted }}>
                No direct team members yet. Share your referral link to build your team!
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: textMuted }}>No tree data found</div>
        )}
      </div>
    </div>
  );
}
