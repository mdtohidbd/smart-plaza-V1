const Offer = require('../models/Offer');

// @desc    Get all offers
// @route   GET /api/offers
// @access  Public (Can filter by isActive)
const getOffers = async (req, res) => {
  try {
    const { isActive, type } = req.query;
    let query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (type) {
      query.type = type;
    }
    const offers = await Offer.find(query)
      .sort({ createdAt: -1 })
      .populate('product', 'name image mrp sellingPrice sku');
    res.status(200).json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single offer
// @route   GET /api/offers/:id
// @access  Private/Admin
const getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('product', 'name image mrp sellingPrice sku');
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    res.status(200).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new offer
// @route   POST /api/offers
// @access  Private/Admin
const createOffer = async (req, res) => {
  try {
    const offer = new Offer(req.body);
    const createdOffer = await offer.save();
    res.status(201).json(createdOffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update offer
// @route   PUT /api/offers/:id
// @access  Private/Admin
const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    Object.assign(offer, req.body);
    const updatedOffer = await offer.save();
    res.status(200).json(updatedOffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete offer
// @route   DELETE /api/offers/:id
// @access  Private/Admin
const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    await offer.deleteOne();
    res.status(200).json({ message: 'Offer removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer
};
