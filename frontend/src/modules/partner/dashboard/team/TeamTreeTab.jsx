import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ChevronRight, ChevronDown, User, ShieldCheck, Clock, 
  TrendingUp, Award, Layers, RefreshCw, Eye
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://gharkapaisa.in/api/v1';

export default function TeamTreeTab({ onSelectMember }) {
  const [rootNode, setRootNode] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [childrenMap, setChildrenMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  useEffect(() => {
    fetchRootTree();
  }, []);

  const fetchRootTree = async () => {
    setInitialLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const res = await axios.get(`${API_URL}/team/tree`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const root = res.data.root;
        const initialChildren = res.data.data || [];
        setRootNode(root);
        if (root) {
          setChildrenMap(prev => ({ ...prev, [root.id]: initialChildren }));
          setExpandedNodes(prev => ({ ...prev, [root.id]: true }));
        }
      }
    } catch (err) {
      console.error('Failed to load team tree:', err);
      setError(err.response?.data?.message || 'Failed to load team hierarchy');
    } finally {
      setInitialLoading(false);
    }
  };

  const toggleExpandNode = async (nodeId) => {
    const isCurrentlyExpanded = !!expandedNodes[nodeId];

    if (isCurrentlyExpanded) {
      setExpandedNodes(prev => ({ ...prev, [nodeId]: false }));
      return;
    }

    // Expand
    setExpandedNodes(prev => ({ ...prev, [nodeId]: true }));

    // Fetch children if not already cached
    if (!childrenMap[nodeId]) {
      setLoadingMap(prev => ({ ...prev, [nodeId]: true }));
      try {
        const token = getAuthToken();
        const res = await axios.get(`${API_URL}/team/tree?parent_id=${nodeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setChildrenMap(prev => ({ ...prev, [nodeId]: res.data.data || [] }));
        }
      } catch (err) {
        console.error(`Failed to load children for node ${nodeId}:`, err);
      } finally {
        setLoadingMap(prev => ({ ...prev, [nodeId]: false }));
      }
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  // Node Component
  const TreeNode = ({ node, level = 0 }) => {
    const isExpanded = !!expandedNodes[node.id];
    const isLoadingChildren = !!loadingMap[node.id];
    const nodeChildren = childrenMap[node.id] || [];

    return (
      <div className="relative pl-4 sm:pl-8 my-2 border-l-2 border-slate-700/60 transition-all">
        {/* Horizontal Connector Line */}
        <div className="absolute top-6 left-0 w-4 sm:w-8 h-0.5 bg-slate-700/60"></div>

        {/* Node Card */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 shadow-md backdrop-blur-md transition-all group max-w-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left Info */}
            <div className="flex items-center gap-3">
              {/* Expand Toggle Button */}
              {node.has_children ? (
                <button
                  onClick={() => toggleExpandNode(node.id)}
                  disabled={isLoadingChildren}
                  className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                >
                  {isLoadingChildren ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  ) : isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-indigo-400" />
                  )}
                </button>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-slate-800/60 flex items-center justify-center text-slate-500">
                  <User className="w-4 h-4" />
                </div>
              )}

              {/* Photo & Details */}
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 overflow-hidden">
                {node.profile_photo_url ? (
                  <img src={node.profile_photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (node.full_name || node.first_name || 'P').slice(0, 2).toUpperCase()
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 
                    onClick={() => onSelectMember(node.id)}
                    className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    {node.full_name || `${node.first_name || ''} ${node.last_name || ''}`}
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {node.rank || 'Partner'}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    L{level}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Code: {node.partner_code}</p>
              </div>
            </div>

            {/* Right Status & Metrics */}
            <div className="flex items-center gap-3">
              <div className="text-right text-xs">
                <p className="text-slate-400">Team Business</p>
                <p className="font-bold text-emerald-400">{formatCurrency(node.business)}</p>
              </div>

              <div className="text-right text-xs">
                <p className="text-slate-400">Direct Recruits</p>
                <p className="font-bold text-indigo-400">{node.direct_children_count} Members</p>
              </div>

              <button
                onClick={() => onSelectMember(node.id)}
                title="View 360° Profile"
                className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Children Render */}
        {isExpanded && nodeChildren.length > 0 && (
          <div className="mt-2">
            {nodeChildren.map(child => (
              <TreeNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}

        {isExpanded && nodeChildren.length === 0 && !isLoadingChildren && (
          <div className="pl-6 py-2 text-xs text-slate-500 italic">No direct sub-members</div>
        )}
      </div>
    );
  };

  if (initialLoading) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Building team tree hierarchy...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-rose-500/30 text-rose-400">
        <p className="text-sm font-semibold">{error}</p>
        <button onClick={fetchRootTree} className="mt-3 px-4 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-semibold hover:bg-rose-500/30">
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tree Header Controls */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Interactive Team Hierarchy Tree
          </h3>
          <p className="text-xs text-slate-400">Expand any node to inspect direct and indirect downline teams lazily</p>
        </div>
        <button
          onClick={fetchRootTree}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reload Tree
        </button>
      </div>

      {/* Tree Display */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 shadow-2xl overflow-x-auto min-h-[400px]">
        {rootNode ? (
          <div className="min-w-[600px]">
            {/* Root Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/40 shadow-xl max-w-2xl mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300 text-lg overflow-hidden">
                    {rootNode.profile_photo_url ? (
                      <img src={rootNode.profile_photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      rootNode.full_name?.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-white text-base">{rootNode.full_name}</h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                        {rootNode.rank || 'Partner (You)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Partner Code: {rootNode.partner_code}</p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <p className="text-slate-400">Total Team Business</p>
                  <p className="text-base font-extrabold text-emerald-400">{formatCurrency(rootNode.business)}</p>
                </div>
              </div>
            </div>

            {/* Direct Children Trees */}
            {childrenMap[rootNode.id] && childrenMap[rootNode.id].length > 0 ? (
              childrenMap[rootNode.id].map(child => (
                <TreeNode key={child.id} node={child} level={1} />
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                You have not registered any direct team members yet. Share your referral link to build your team!
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">No tree data found</div>
        )}
      </div>
    </div>
  );
}
