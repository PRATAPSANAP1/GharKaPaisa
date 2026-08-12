/**
 * formPersist.js
 * Automatic form state persistence utility across page reloads.
 * Saves input values to sessionStorage and restores them on page load.
 */

const STORAGE_PREFIX = 'gkp_form_draft_';

/**
 * Save form state to sessionStorage
 * @param {string} key - Form identifier
 * @param {object} data - Form key-value payload
 */
export function saveFormDraft(key, data) {
  if (!key || !data) return;
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
  } catch (err) {
    console.warn('[formPersist] Error saving draft:', err);
  }
}

/**
 * Load form draft from sessionStorage
 * @param {string} key - Form identifier
 * @returns {object|null}
 */
export function loadFormDraft(key) {
  if (!key) return null;
  try {
    const saved = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    console.warn('[formPersist] Error loading draft:', err);
    return null;
  }
}

/**
 * Clear form draft from sessionStorage
 * @param {string} key - Form identifier
 */
export function clearFormDraft(key) {
  if (!key) return;
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch (err) {}
}

/**
 * Global event listener attachment for automatic DOM input persistence
 */
export function initGlobalFormPersistence() {
  if (typeof window === 'undefined') return;

  const getPageKey = () => `auto_${window.location.pathname.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const saveInput = (target) => {
    if (!target || !target.name && !target.id) return;
    const fieldKey = target.name || target.id;
    if (target.type === 'password' || target.type === 'file' || target.type === 'hidden') return;

    try {
      const pageKey = getPageKey();
      const currentDraft = loadFormDraft(pageKey) || {};
      currentDraft[fieldKey] = target.type === 'checkbox' ? target.checked : target.value;
      saveFormDraft(pageKey, currentDraft);
    } catch (e) {}
  };

  // Restore input values on page mount
  const restoreFormInputs = () => {
    try {
      const pageKey = getPageKey();
      const draft = loadFormDraft(pageKey);
      if (!draft) return;

      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach(el => {
        const fieldKey = el.name || el.id;
        if (!fieldKey || el.type === 'password' || el.type === 'file') return;
        if (draft[fieldKey] !== undefined && draft[fieldKey] !== null) {
          if (el.type === 'checkbox') {
            el.checked = Boolean(draft[fieldKey]);
          } else if (el.value === '' || el.value !== draft[fieldKey]) {
            el.value = draft[fieldKey];
            // Dispatch input & change events for React synthetic event listeners
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      });
    } catch (e) {}
  };

  // Listen to input and change events
  window.addEventListener('input', (e) => saveInput(e.target));
  window.addEventListener('change', (e) => saveInput(e.target));

  // Listen to form submit to clear auto draft
  window.addEventListener('submit', () => {
    try {
      clearFormDraft(getPageKey());
    } catch (e) {}
  });

  // Run initial restore after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreFormInputs);
  } else {
    setTimeout(restoreFormInputs, 200);
  }
}
