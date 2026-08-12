import { useEffect, useRef } from 'react';
import { saveFormDraft, loadFormDraft, clearFormDraft } from '../utils/formPersist';

/**
 * Custom React hook to automatically persist controlled form fields across page reloads.
 * @param {string} formKey - Unique key identifier for the form
 * @param {object} formValues - Object containing current state values
 * @param {function} setFormValues - State updater function (or object of state setters)
 */
export function useFormPersistence(formKey, formValues, setFormValues) {
  const isRestored = useRef(false);

  // Restore values on initial mount
  useEffect(() => {
    if (!formKey || isRestored.current) return;
    try {
      const saved = loadFormDraft(formKey);
      if (saved && typeof saved === 'object') {
        if (typeof setFormValues === 'function') {
          setFormValues(prev => (typeof prev === 'object' && prev !== null ? { ...prev, ...saved } : saved));
        } else if (typeof setFormValues === 'object' && setFormValues !== null) {
          // Object of individual setter functions
          Object.keys(saved).forEach(key => {
            if (typeof setFormValues[key] === 'function' && saved[key] !== undefined && saved[key] !== null) {
              setFormValues[key](saved[key]);
            }
          });
        }
      }
    } catch (err) {
      console.warn(`[useFormPersistence] Error restoring ${formKey}:`, err);
    } finally {
      isRestored.current = true;
    }
  }, [formKey]);

  // Save values whenever formValues state changes
  useEffect(() => {
    if (!formKey || !isRestored.current) return;
    try {
      if (formValues && typeof formValues === 'object') {
        const hasData = Object.values(formValues).some(v => v !== '' && v !== null && v !== undefined);
        if (hasData) {
          saveFormDraft(formKey, formValues);
        }
      }
    } catch (err) {
      console.warn(`[useFormPersistence] Error saving ${formKey}:`, err);
    }
  }, [formKey, formValues]);

  const resetDraft = () => {
    clearFormDraft(formKey);
  };

  return { clearPersistedDraft: resetDraft };
}
