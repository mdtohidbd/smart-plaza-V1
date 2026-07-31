require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

const Product = require('../models/Product');
const Banner = require('../models/Banner');
const Testimonial = require('../models/Testimonial');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment');
    process.exit(1);
  }
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected successfully!');
};

const sampleImages = {
  audio: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80'
  ],
  phone: [
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80',
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80'
  ],
  laptop: [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80'
  ],
  watch: [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80'
  ],
  accessories: [
    'https://images.unsplash.com/photo-1609592424009-dd2790933737?w=800&q=80',
    'https://images.unsplash.com/photo-1622445268465-8432b13d0859?w=800&q=80'
  ]
};

const assignImageByName = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('macbook') || lower.includes('laptop') || lower.includes('hp') || lower.includes('thinkpad')) {
    return sampleImages.laptop;
  }
  if (lower.includes('iphone') || lower.includes('galaxy') || lower.includes('phone') || lower.includes('mobile') || lower.includes('infinix') || lower.includes('vivo') || lower.includes('realme') || lower.includes('oppo')) {
    return sampleImages.phone;
  }
  if (lower.includes('charge') || lower.includes('flip') || lower.includes('headphone') || lower.includes('earbud') || lower.includes('jbl') || lower.includes('sound') || lower.includes('speaker') || lower.includes('airpods')) {
    return sampleImages.audio;
  }
  if (lower.includes('watch') || lower.includes('band') || lower.includes('smartwatch')) {
    return sampleImages.watch;
  }
  return sampleImages.accessories;
};

const updateProducts = async () => {
  console.log('\n📦 Updating products with images and ecommerce listing status...');
  const products = await Product.find({});
  console.log(`Found ${products.length} products in database.`);

  const sections = ['Featured Products', 'Best Sellers', 'Hot Deals'];

  let updatedCount = 0;
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const imageList = assignImageByName(product.name);
    const primaryImg = imageList[i % imageList.length];
    const secondaryImg = imageList[(i + 1) % imageList.length];

    product.image = primaryImg;
    product.images = [primaryImg, secondaryImg];
    product.isListedOnEcommerce = true;
    product.isPreorder = true;
    
    // Distribute section evenly so all homepage sections have items
    product.landingPageSection = sections[i % sections.length];
    product.ecommerceOrder = i + 1;

    await product.save();
    updatedCount++;
  }
  console.log(`✅ Successfully updated ${updatedCount} products with high-res images and storefront settings.`);
};

const updateBanners = async () => {
  console.log('\n🖼️ Updating Hero & Side Banners...');
  await Banner.deleteMany({}); // Reset banners

  const banners = [
    {
      title: 'Next Gen Tech Collection - Best Deals',
      image: 'https://images.unsplash.com/photo-1498049860654-af1a5c566876?w=1600&q=80',
      images: ['https://images.unsplash.com/photo-1498049860654-af1a5c566876?w=1600&q=80'],
      link: '/shop/products',
      position: 'main',
      isActive: true,
      displayOrder: 1
    },
    {
      title: 'Premium Gadgets & Smart Accessories',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80',
      images: ['https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80'],
      link: '/shop/products',
      position: 'main',
      isActive: true,
      displayOrder: 2
    },
    {
      title: 'Ultimate Audio Experience - Up to 40% Off',
      image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1600&q=80',
      images: ['https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1600&q=80'],
      link: '/shop/products',
      position: 'main',
      isActive: true,
      displayOrder: 3
    },
    {
      title: 'Wireless Audio Sale',
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'],
      link: '/shop/products',
      position: 'side_top',
      isActive: true,
      displayOrder: 1
    },
    {
      title: 'Smart Wearables Collection',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'],
      link: '/shop/products',
      position: 'side_bottom',
      isActive: true,
      displayOrder: 1
    }
  ];

  await Banner.insertMany(banners);
  console.log(`✅ Successfully seeded ${banners.length} main & side banners.`);
};

const updateTestimonials = async () => {
  console.log('\n💬 Updating Customer Testimonials...');
  await Testimonial.deleteMany({}); // Clear existing

  const testimonials = [
    {
      name: 'Tanvir Ahmed',
      email: 'tanvir@gmail.com',
      rating: 5,
      message: 'Great experience buying from Smart Plaza! The product quality is top notch and delivery was extremely fast.',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      designation: 'Software Engineer',
      company: 'Dhaka Tech',
      location: 'Dhaka, Bangladesh',
      product: 'JBL Charge 5',
      verified: true,
      recommend: true,
      status: 'approved'
    },
    {
      name: 'Nusrat Jahan',
      email: 'nusrat@gmail.com',
      rating: 5,
      message: 'Authentic gadget store in BD. Got my original smartwatch with official warranty. Highly recommended!',
      imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
      designation: 'UI/UX Designer',
      company: 'Creative Studio',
      location: 'Chittagong, Bangladesh',
      product: 'Smart Watch Pro',
      verified: true,
      recommend: true,
      status: 'approved'
    },
    {
      name: 'Rahim Chowdhury',
      email: 'rahim@gmail.com',
      rating: 5,
      message: 'Excellent customer service and genuine products. Will definitely order again from Smart Plaza.',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      designation: 'Business Manager',
      company: 'Apex Ltd',
      location: 'Sylhet, Bangladesh',
      product: 'Wireless Headphones',
      verified: true,
      recommend: true,
      status: 'approved'
    }
  ];

  await Testimonial.insertMany(testimonials);
  console.log(`✅ Successfully seeded ${testimonials.length} approved customer testimonials.`);
};

const run = async () => {
  await connectDB();
  try {
    await updateProducts();
    await updateBanners();
    await updateTestimonials();
    console.log('\n🎉 ALL DATA & IMAGES POPULATED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('❌ Error during data population:', err);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

run();
