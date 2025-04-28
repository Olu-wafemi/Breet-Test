import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/productservice';
import { CreateProductInput, UpdateProductInput, QueryProductsParams } from '../schemas/productschema';
import { asyncHandler } from '../middleware/errorhandler';

export const createProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const productData = req.body as CreateProductInput;
  const product = await productService.createProduct(productData);
  
  res.status(201).json({
    success: true,
    data: product
  });
});

export const getProducts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const queryParams = req.query as unknown as QueryProductsParams;
  const result = await productService.getAllProducts(queryParams);
  
  res.status(200).json({
    success: true,
    count: result.products.length,
    totalProducts: result.totalProducts,
    totalPages: result.totalPages,
    currentPage: queryParams.page || 1,
    data: result.products
  });
});

export const getProductById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const productId = req.params.id;
  const product = await productService.getProductById(productId);
  
  res.status(200).json({
    success: true,
    data: product
  });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const productId = req.params.id;
  const updateData = req.body as UpdateProductInput;
  const product = await productService.updateProduct(productId, updateData);
  
  res.status(200).json({
    success: true,
    data: product
  });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const productId = req.params.id;
  await productService.deleteProduct(productId);
  
  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});