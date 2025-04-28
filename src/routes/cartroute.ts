import express from 'express';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { 
  addToCartSchema, 
  updateCartItemSchema, 
  removeFromCartSchema 
} from '../schemas/cartschema';
import { 
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cartcontroller';

const router = express.Router();


router.use(protect);

router.route('/')
  .get(getCart)
  .delete(clearCart);

router.post('/add', validate(addToCartSchema), addToCart);
router.put('/update', validate(updateCartItemSchema), updateCartItem);
router.post('/remove', validate(removeFromCartSchema), removeFromCart);

export default router;