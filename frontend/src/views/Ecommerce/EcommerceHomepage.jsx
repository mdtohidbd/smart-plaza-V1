import React from 'react';
import { Box } from '@mui/material';
import EcommerceLayout from '../../ecommerce/layout/EcommerceLayout';
import HeroBanner from '../../ecommerce/components/HeroBanner';
import Categories from '../../ecommerce/components/Categories';
import ProductSlider from '../../ecommerce/components/ProductSlider';
import DealSlider from '../../ecommerce/components/DealSlider';
import BrandsWeProvide from '../../ecommerce/components/BrandsWeProvide';
import Testimonials from '../../ecommerce/components/Testimonials';
import Features from '../../ecommerce/components/Features';

const EcommerceHomepage = () => {
  return (
    <EcommerceLayout>
      {/* Hero Banner - EyeGears Style */}
      <HeroBanner />

      {/* Trust Features Bar */}
      <Features />

      {/* Categories Section - EyeGears Style */}
      <Categories />

      {/* Featured Products Slider - EyeGears Style */}
      <ProductSlider title="Featured Products" limit={8} section="Featured Products" />

      {/* New Arrivals Slider */}
      <ProductSlider title="New Arrivals" limit={8} sortBy="newest" section="Default" />

      {/* Best Sellers Slider */}
      <ProductSlider title="Best Sellers" limit={8} section="Best Sellers" />

      {/* Deal Slider - Hot Deals */}
      <DealSlider />

      {/* Brands We Provide Section */}
      <BrandsWeProvide />

      {/* Testimonials Section */}
      <Testimonials />

    </EcommerceLayout>
  );
};

export default EcommerceHomepage;
