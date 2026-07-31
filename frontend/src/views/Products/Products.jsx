import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequirePermission from '../../components/RequirePermission';
import AllProducts from './AllProducts';
import AddProduct from './AddProduct';
import EditProduct from './EditProduct';
import Categories from './Categories';
import Units from './Units';
import ProductImages from './ProductImages';
import ProductImagesManagement from './ProductImagesManagement';
import Brands from './Brands';
import EcommerceAdmin from './EcommerceAdmin';

const Products = () => {
  return (
    <div>
      <Routes>
        <Route
          path="all"
          element={
            <RequirePermission
              module="products"
              action="read"
            >
              <AllProducts />
            </RequirePermission>
          }
        />
        <Route
          path="add"
          element={
            <RequirePermission
              module="products"
              action="create"
            >
              <AddProduct />
            </RequirePermission>
          }
        />
        <Route
          path="edit/:id"
          element={
            <RequirePermission
              module="products"
              action="update"
            >
              <EditProduct />
            </RequirePermission>
          }
        />
        <Route
          path="images"
          element={
            <RequirePermission
              module="products"
              action="update"
            >
              <ProductImagesManagement />
            </RequirePermission>
          }
        />
        <Route
          path="images/:id"
          element={
            <RequirePermission
              module="products"
              action="read"
            >
              <ProductImages />
            </RequirePermission>
          }
        />
        <Route
          path="categories"
          element={
            <RequirePermission
              module="products"
              action="read"
            >
              <Categories />
            </RequirePermission>
          }
        />
        <Route
          path="units"
          element={
            <RequirePermission
              module="products"
              action="read"
            >
              <Units />
            </RequirePermission>
          }
        />
        <Route
          path="brands"
          element={
            <RequirePermission
              module="products"
              action="read"
            >
              <Brands />
            </RequirePermission>
          }
        />
        <Route
          path="ecommerce"
          element={
            <RequirePermission
              module="products"
              action="update"
            >
              <EcommerceAdmin />
            </RequirePermission>
          }
        />
        <Route
          index
          element={
            <RequirePermission
              module="products"
              action="read"
            >
              <AllProducts />
            </RequirePermission>
          }
        />
      </Routes>
    </div>
  );
};

export default Products;