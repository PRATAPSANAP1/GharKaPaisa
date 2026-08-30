const searchService = require('./chatbot.search.service');
const { USER_ROLES } = require('./chatbot.constants');

class ChatbotProductService {
  /**
   * Handle exact product response formatting & URL resolution
   */
  async formatExactProductResponse(product, context) {
    const linkData = await this.resolveProductLinkAndReward(product, context);

    return {
      type: 'PRODUCT',
      message: `I found ${product.name} (${product.bank_name || 'GharKaPaisa'}).`,
      data: {
        product: {
          id: product.id,
          name: product.name,
          category: product.category,
          description: product.description || product.short_description || '',
          imageUrl: product.image_url || product.image || product.logo || null,
          bankName: product.bank_name || 'GharKaPaisa',
          annualFee: product.is_lifetime_free ? '₹0 Lifetime Free (LTF)' : (product.annual_fee || 'Standard Fee'),
          welcomeBenefits: product.welcome_benefits || product.features || null,
          rewards: product.rewards || product.cashback || null,
          slug: product.slug,
          actionUrl: linkData.actionUrl,
          shareUrl: linkData.shareUrl,
          rewardLabel: linkData.rewardLabel,
          rewardValue: linkData.rewardValue
        }
      }
    };
  }

  /**
   * Handle multi-product list formatting
   */
  async formatProductListResponse(products, title, context) {
    const formattedProducts = await Promise.all(
      products.map(async (p) => {
        const linkData = await this.resolveProductLinkAndReward(p, context);
        return {
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description || p.short_description || '',
          imageUrl: p.image_url || p.image || p.logo || null,
          bankName: p.bank_name || 'GharKaPaisa',
          annualFee: p.is_lifetime_free ? '₹0 Lifetime Free' : (p.annual_fee || ''),
          slug: p.slug,
          actionUrl: linkData.actionUrl,
          shareUrl: linkData.shareUrl,
          rewardLabel: linkData.rewardLabel,
          rewardValue: linkData.rewardValue
        };
      })
    );

    return {
      type: 'PRODUCT_LIST',
      message: title || `Found ${products.length} products for you.`,
      data: {
        products: formattedProducts
      }
    };
  }

  /**
   * Resolve Product Link & Reward Amount strictly by Role & Permissions Matrix
   * IMPORTANT: Employees MUST get employee_product_links.employee_referral_url and INCENTIVE amount!
   */
  async resolveProductLinkAndReward(product, context) {
    const result = {
      actionUrl: `/products/credit_card/${product.slug || product.id}`,
      shareUrl: null,
      rewardLabel: null,
      rewardValue: null
    };

    // Employee Role: Uses employee_product_links and Incentive
    if (context.role === USER_ROLES.EMPLOYEE && context.employeeId) {
      const empLink = await searchService.getEmployeeProductLink(context.employeeId, product.id);
      if (empLink) {
        result.shareUrl = empLink.employee_referral_url;
        result.rewardLabel = 'Incentive';
        result.rewardValue = `₹${empLink.incentive_amount || 0}`;
      } else {
        result.rewardLabel = 'Incentive';
        result.rewardValue = 'Active';
      }
      result.actionUrl = '/employee/credit-cards';
      return result;
    }

    // Partner Role: Uses partner_url and Commission
    if (context.role === USER_ROLES.PARTNER || context.role === USER_ROLES.TEAM_MEMBER) {
      result.actionUrl = '/partner/products';
      result.shareUrl = product.partner_url || `/apply/${context.partnerCode || 'partner'}/${product.id}`;
      result.rewardLabel = 'Commission';
      result.rewardValue = product.commission_value ? `Up to ₹${product.commission_value}` : 'Standard Payout';
      return result;
    }

    // Admin / SuperAdmin Role
    if (context.role === USER_ROLES.ADMIN || context.role === USER_ROLES.SUPER_ADMIN) {
      result.actionUrl = context.role === USER_ROLES.SUPER_ADMIN ? '/super-admin/products' : '/admin/products';
      result.rewardLabel = 'Commission';
      result.rewardValue = product.commission_value ? `₹${product.commission_value}` : null;
      return result;
    }

    // Public Visitor Role: Uses public_url or Product Details Route
    result.actionUrl = `/products/credit_card/${product.slug || product.id}`;
    result.shareUrl = product.public_url || `/products/credit_card/${product.slug || product.id}/apply`;

    return result;
  }
}

module.exports = new ChatbotProductService();
