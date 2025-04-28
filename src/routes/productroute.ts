import express from 'express';
import { protect, admin } from '../middleware/auth';
import { validate, validateParams, validateQuery } from '../middleware/validate';
import { 
  createProductSchema, 
  updateProductSchema,
  productIdSchema,
  queryProductsSchema
} from '../schemas/productschema';
import { 
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from '../controllers/productcontroller';

const router 
= express.Router();

router.route('/')
  .post(protect, admin, validate(createProductSchema), createProduct)
  .get( getProducts);

router.route('/:id')
  .get(validateParams(productIdSchema), getProductById)
  .put(protect, admin, validateParams(productIdSchema), validate(updateProductSchema), updateProduct)
  .delete(protect, admin, validateParams(productIdSchema), deleteProduct);

export default router;