import api from './api';

/**
 * Shared helper to resolve how a product should be applied for (internal form vs external/affiliate url).
 * Tracks the click on the backend and navigates or opens the internal lead form modal.
 *
 * @param {string} productId - Product ID
 * @param {object} options - Callbacks
 * @param {function} options.onInternalForm - Callback to open the existing internal modal form
 */
export async function resolveAndApply(productId, { onInternalForm } = {}) {
  try {
    const res = await api.get(`/products/${productId}/apply`);
    const { application_type, application_url, open_type } = res.data.data;

    if (application_type === 'external_url' || application_type === 'affiliate_url' || application_type === 'api_integration') {
      if (application_url) {
        if (open_type === 'new_tab') {
          window.open(application_url, '_blank');
        } else {
          window.location.href = application_url;
        }
      } else {
        // Fallback to internal form if URL is missing
        onInternalForm?.();
      }
    } else {
      // Default / internal_form
      onInternalForm?.();
    }
  } catch (err) {
    console.error('Failed to resolve application settings:', err);
    // Fallback to internal form on error to ensure user can apply
    onInternalForm?.();
  }
}
