const searchService = require('./chatbot.search.service');
const productService = require('./chatbot.product.service');

class ChatbotBankService {
  /**
   * Handle bank-wide product queries ("Give me all HDFC cards")
   */
  async handleBankProducts(bank, categoryFilter, context) {
    const products = await searchService.searchProductsByBank(bank.id, categoryFilter);

    if (products.length === 0) {
      return {
        type: 'TEXT',
        message: `I found ${bank.name}, but there are currently no active products available for this category in our database.`,
        data: {
          bank: {
            id: bank.id,
            name: bank.name,
            shortCode: bank.short_code,
            logoUrl: bank.logo_url
          }
        }
      };
    }

    const formattedProducts = await Promise.all(
      products.map(async (p) => {
        const linkData = await productService.resolveProductLinkAndReward(p, context);
        return {
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description || '',
          imageUrl: p.image_url || p.image || p.logo || null,
          bankName: bank.name,
          annualFee: p.is_lifetime_free ? '₹0 Lifetime Free' : (p.annual_fee || ''),
          slug: p.slug,
          actionUrl: linkData.actionUrl,
          shareUrl: linkData.shareUrl,
          rewardLabel: linkData.rewardLabel,
          rewardValue: linkData.rewardValue
        };
      })
    );

    const categoryLabel = categoryFilter ? categoryFilter.replace('_', ' ').toUpperCase() : 'PRODUCTS';

    return {
      type: 'BANK_PRODUCT_LIST',
      message: `🏦 ${bank.name} ${categoryLabel}\n\nI found ${products.length} products listed for ${bank.name}.`,
      data: {
        bank: {
          id: bank.id,
          name: bank.name,
          shortCode: bank.short_code,
          logoUrl: bank.logo_url
        },
        products: formattedProducts
      }
    };
  }
}

module.exports = new ChatbotBankService();
