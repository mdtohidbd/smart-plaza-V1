const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Testimonial = require('../models/Testimonial');
const Banner = require('../models/Banner');
const Brand = require('../models/Brand');
const Offer = require('../models/Offer');
const StockBatch = require('../models/StockBatch');
const path = require('path');
const fs = require('fs');

async function getActiveOffersMap() {
  try {
    const offers = await Offer.find({ isActive: true, type: 'campaign' });
    const offerMap = {};
    for (const offer of offers) {
      if (offer.product) {
        // If multiple offers exist for the same product, the last one overrides.
        // Usually, there's only one active per product.
        offerMap[offer.product.toString()] = offer;
      }
    }
    return offerMap;
  } catch (err) {
    console.error('Error fetching active offers:', err);
    return {};
  }
}

/** Map DB product fields to what the storefront UI expects (price, stock, cuttedPrice). */
function mapProductForEcommerce(doc, activeOffersMap = {}, stockMap = {}) {
  const o = doc.toObject ? doc.toObject() : { ...doc };
  const productIdStr = o._id ? o._id.toString() : null;
  
  const offer = productIdStr ? activeOffersMap[productIdStr] : null;
  
  let selling = o.sellingPrice ?? 0;
  let mrp = o.mrp != null ? o.mrp : selling;
  
  if (offer) {
    const originalSelling = selling;
    if (typeof offer === 'object') {
      if (offer.discountType === 'flat') {
        selling = Math.max(0, selling - (offer.discountAmount || 0));
      } else {
        const pct = offer.discountPercentage || 0;
        selling = selling - (selling * pct / 100);
      }
    } else if (typeof offer === 'number' && offer > 0) {
      selling = selling - (selling * offer / 100);
    }
    // Ensure cuttedPrice displays the original price if it wasn't already higher
    if (mrp <= selling || mrp === originalSelling) {
      mrp = originalSelling;
    }
  }

  // Determine actual stock from batch data or fallback to openingStock
  const batchStock = productIdStr ? (stockMap[productIdStr] || 0) : 0;
  const actualStock = batchStock > 0 ? batchStock : (o.openingStock ?? 0);

  // Preorder override: if isPreorder + isListedOnEcommerce, show as in-stock (stock = 1)
  // even if no physical stock exists
  const isPreorderInStock = o.isPreorder && o.isListedOnEcommerce;
  const effectiveStock = actualStock > 0 ? actualStock : (isPreorderInStock ? 1 : 0);

  return {
    ...o,
    price: selling,
    cuttedPrice: mrp > selling ? mrp : undefined,
    stock: effectiveStock,
    isPreorder: o.isPreorder || false,
    // Storefront consumers can use this to show "Pre-order" badge
    isPreorderItem: isPreorderInStock && actualStock === 0,
  };
}

// @desc    Get public banners
// @route   GET /api/public/banners
exports.getPublicBanners = async (req, res) => {
  try {
    const { productId, categoryId } = req.query;
    let query = { isActive: true };

    if (productId || categoryId) {
      query.$or = [
        { targetProduct: productId },
        { targetCategory: categoryId },
        { targetProduct: { $exists: false }, targetCategory: { $exists: false } },
        { targetProduct: null, targetCategory: null }
      ];
    }

    const banners = await Banner.find(query).sort({ displayOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: banners.length, data: banners });
  } catch (error) {
    console.error('[PUBLIC BANNERS] Error fetching banners:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch banners' });
  }
};

// @desc    Get public brands
// @route   GET /api/public/brands
exports.getPublicBrands = async (req, res) => {
  try {
    const { category } = req.query;
    let query = { isActive: true };
    let categoryFilter = {};

    if (category) {
      let categoryId = null;
      if (mongoose.Types.ObjectId.isValid(category)) {
        categoryId = new mongoose.Types.ObjectId(category);
      } else {
        const categoryDoc = await Category.findOne({ name: { $regex: new RegExp('^' + category + '$', 'i') } });
        if (categoryDoc) categoryId = categoryDoc._id;
      }

      if (categoryId) {
        const subCategories = await Category.find({ parent: categoryId });
        const allCategoryIds = [categoryId, ...subCategories.map(c => c._id)];
        
        categoryFilter = { category: { $in: allCategoryIds } };
        
        const products = await Product.find({
          ...categoryFilter,
          isActive: true,
          brand: { $ne: null }
        }).select('brand');

        const brandIds = [...new Set(products.map(p => p.brand.toString()))];
        query._id = { $in: brandIds.map(id => new mongoose.Types.ObjectId(id)) };
      } else {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
    }

    const brands = await Brand.find(query)
      .select('name logo description website country displayOrder')
      .sort({ displayOrder: 1, name: 1 });
      
    const brandsWithCount = await Promise.all(brands.map(async (brand) => {
      const productCount = await Product.countDocuments({
        brand: brand._id,
        isActive: true,
        ...categoryFilter
      });
      return { ...brand.toObject(), productCount };
    }));
    
    res.status(200).json({ success: true, count: brandsWithCount.length, data: brandsWithCount });
  } catch (error) {
    console.error('[PUBLIC BRANDS] Error fetching brands:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch brands' });
  }
};

// @desc    Get related products
// @route   GET /api/public/products/:id/related
exports.getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit, 10) || 4;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    let relatedProducts = await Product.find({ _id: { $ne: id }, category: product.category, isActive: true })
      .populate('category', 'name').populate('supplier', 'name companyName').populate('brand', 'name logo').limit(limit);

    if (relatedProducts.length < limit) {
      const needed = limit - relatedProducts.length;
      const excludeIds = [id, ...relatedProducts.map(p => p._id)];
      const additional = await Product.find({ _id: { $nin: excludeIds }, supplier: product.supplier, isActive: true })
        .populate('category', 'name').populate('supplier', 'name companyName').populate('brand', 'name logo').limit(needed);
      relatedProducts = [...relatedProducts, ...additional];
    }

    if (relatedProducts.length < limit) {
      const needed = limit - relatedProducts.length;
      const excludeIds = [id, ...relatedProducts.map(p => p._id)];
      const extra = await Product.find({ _id: { $nin: excludeIds }, isActive: true })
        .populate('category', 'name').populate('supplier', 'name companyName').populate('brand', 'name logo').limit(needed);
      relatedProducts = [...relatedProducts, ...extra];
    }

    const activeOffersMap = await getActiveOffersMap();
    const data = relatedProducts.map(p => mapProductForEcommerce(p, activeOffersMap));
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch related products' });
  }
};

// @desc    Get public product by ID
// @route   GET /api/public/products/:id
exports.getPublicProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }

    const product = await Product.findById(id)
      .populate('category', 'name').populate('supplier', 'name companyName').populate('brand', 'name logo');

    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not available' });
    }

    // Build stockMap from active batches for this single product
    const batchData = await StockBatch.aggregate([
      { $match: { product: product._id, isActive: true, remainingQty: { $gt: 0 } } },
      { $group: { _id: '$product', totalStock: { $sum: '$remainingQty' } } }
    ]);
    const stockMap = {};
    for (const b of batchData) stockMap[b._id.toString()] = b.totalStock;

    const activeOffersMap = await getActiveOffersMap();
    res.status(200).json({ success: true, data: mapProductForEcommerce(product, activeOffersMap, stockMap) });
  } catch (error) {
    console.error('Error fetching public product:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
};

// @desc    Get public products
// @route   GET /api/public/products
exports.getPublicProducts = async (req, res) => {
  try {
    const { limit = 12, page = 1, category, company, search, sortBy, inStock, brand, section } = req.query;
    const query = { isActive: true };

    if (section && section !== 'Default') {
      query.landingPageSection = section;
    }

    if (category) {
      let categoryId = null;
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        categoryId = new mongoose.Types.ObjectId(category);
      } else {
        const categoryDoc = await Category.findOne({ name: { $regex: new RegExp('^' + category + '$', 'i') } });
        if (categoryDoc) categoryId = categoryDoc._id;
      }

      if (categoryId) {
        const subCategories = await Category.find({ parent: categoryId });
        const allCategoryIds = [categoryId, ...subCategories.map(c => c._id)];
        query.category = { $in: allCategoryIds };
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page: 1, data: [] });
      }
    }

    if (company && mongoose.Types.ObjectId.isValid(company)) query.company = company;
    if (brand) {
      const brandIds = brand.split(',').filter(id => mongoose.Types.ObjectId.isValid(id));
      if (brandIds.length > 0) {
        query.brand = { $in: brandIds };
      }
    }
    if (search && String(search).trim()) query.name = { $regex: String(search).trim(), $options: 'i' };
    // inStock filter: include products with real stock OR preorder-listed products
    // We apply post-filter after building stockMap to handle preorder override correctly

    const lim = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
    const pg = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (pg - 1) * lim;

    let sort = { createdAt: -1 };
    switch (sortBy) {
      case 'price_asc': sort = { sellingPrice: 1 }; break;
      case 'price_desc': sort = { sellingPrice: -1 }; break;
      case 'name_asc': sort = { name: 1 }; break;
      case 'newest': sort = { createdAt: -1 }; break;
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name').populate('supplier', 'name companyName').populate('brand', 'name logo')
      .sort(sort).skip(skip).limit(lim);

    // Build stockMap from active batches for all fetched products
    const productIds = products.map(p => p._id);
    const batchData = await StockBatch.aggregate([
      { $match: { product: { $in: productIds }, isActive: true, remainingQty: { $gt: 0 } } },
      { $group: { _id: '$product', totalStock: { $sum: '$remainingQty' } } }
    ]);
    const stockMap = {};
    for (const b of batchData) stockMap[b._id.toString()] = b.totalStock;

    const activeOffersMap = await getActiveOffersMap();
    let mapped = products.map(p => mapProductForEcommerce(p, activeOffersMap, stockMap));

    // Apply inStock filter post-mapping to properly handle preorder overrides
    if (inStock === 'true' || inStock === '1') {
      mapped = mapped.filter(p => p.stock > 0);
    }

    res.status(200).json({
      success: true,
      count: mapped.length,
      total,
      page: pg,
      data: mapped
    });
  } catch (error) {
    console.error('Error fetching public products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

// @desc    Get public categories
// @route   GET /api/public/categories
exports.getPublicCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).populate('parent', 'name').lean();
    
    // Find all distinct categories used in active products
    const activeCategoryIds = await Product.distinct('category', { isActive: true });
    const activeSet = new Set(activeCategoryIds.map(id => id?.toString()).filter(Boolean));

    // Determine which categories have products directly or via children
    const categoriesWithFlags = categories.map(cat => {
      // Direct products
      const hasDirectProducts = activeSet.has(cat._id.toString());
      // Child products (1 level deep)
      const hasChildProducts = categories.some(child => 
        child.parent && child.parent._id.toString() === cat._id.toString() && activeSet.has(child._id.toString())
      );
      
      return {
        ...cat,
        hasProducts: hasDirectProducts || hasChildProducts
      };
    });

    categoriesWithFlags.sort((a, b) => {
      if (a.hasProducts === b.hasProducts) {
        return a.name.localeCompare(b.name);
      }
      return a.hasProducts ? -1 : 1;
    });

    res.status(200).json({ success: true, count: categoriesWithFlags.length, data: categoriesWithFlags });
  } catch (error) {
    console.error('Error fetching public categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

// @desc    Get approved testimonials
// @route   GET /api/public/testimonials/approved
exports.getApprovedTestimonials = async (req, res) => {
  try {
    const { page = 1, limit = 10, rating, product } = req.query;
    const query = { status: 'approved' };
    if (rating) query.rating = parseInt(rating);
    if (product) query.product = product;

    const testimonials = await Testimonial.find(query)
      .sort({ createdAt: -1 })
      .populate('productRef', 'name image')
      .limit(parseInt(limit) * parseInt(page));

    res.status(200).json({ success: true, count: testimonials.length, data: testimonials });
  } catch (error) {
    console.error('Error fetching approved testimonials:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch testimonials' });
  }
};

// @desc    Get public logo
// @route   GET /api/public/logo
exports.getLogo = (req, res) => {
  try {
    const logoPaths = [
      path.join(__dirname, '..', 'public', 'logo.png'),
      path.join(__dirname, '..', 'public', 'logo.jpeg'),
      path.join(__dirname, '..', 'public', 'logo.jpg'),
      path.join(__dirname, '..', '..', 'public', 'logo.png'),
      path.join(__dirname, '..', '..', 'public', 'logo.jpeg'),
      path.join(__dirname, '..', '..', 'frontend', 'src', 'assets', 'logo.png'),
      path.join(__dirname, '..', '..', 'frontend', 'src', 'assets', 'logo.jpeg')
    ];
    let logoPath = null;
    for (const possiblePath of logoPaths) {
      if (fs.existsSync(possiblePath)) {
        logoPath = possiblePath;
        break;
      }
    }
    if (logoPath) res.sendFile(logoPath);
    else res.status(404).json({ message: 'Logo not found' });
  } catch (error) {
    console.error('Error serving logo:', error);
    res.status(500).json({ message: 'Error serving logo' });
  }
};
