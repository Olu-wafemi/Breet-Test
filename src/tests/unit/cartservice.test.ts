import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../../services/cartservice';
import Cart from '../../models/cart';
import Product from '../../models/product';
import mongoose from 'mongoose';
import { NotFoundError, InsufficientStockError } from '../../utils/errors';
import { MongoMemoryServer } from 'mongodb-memory-server';
import user from '../../models/user';


jest.mock('../../src/models/cart', () => {
  
  const mockCart = {
    _id: 'mockCartId',
    items: [],
    save: jest.fn().mockResolvedValue(true),
    session: jest.fn().mockReturnThis(), 
  };


  const mockPopulatedCart = {
    user: '1234',
    items: []
  };

  return {
    
    findOne: jest.fn().mockImplementation(() => {
      return {
        session: jest.fn().mockReturnValue(mockCart),
        populate: jest.fn().mockResolvedValue(mockPopulatedCart)
      };
    }),
    
 
    findById: jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockPopulatedCart)
    }),
    
    create: jest.fn().mockResolvedValue(mockCart),
    findByIdAndUpdate: jest.fn().mockResolvedValue(mockCart),
    findByIdAndDelete: jest.fn().mockResolvedValue(mockCart),
  };
});


jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn().mockResolvedValue(null),
    endSession: jest.fn(),
    abortTransaction: jest.fn().mockResolvedValue(null),
  };
  
  return {
    ...actualMongoose,
    startSession: jest.fn().mockResolvedValue(mockSession),
    
  };
});

jest.mock('../../src/models/product', () => ({
  findById: jest.fn(),
}));

let mongoServer: MongoMemoryServer;

describe('Cart Service', () => {
  let createdCartId: string;

  beforeEach(() => {
    jest.clearAllMocks(); 
  });

  it('should get the cart for a user', async () => {
    const userId = '1234'
    const mockPopulatedCart = { user: userId, items: [] };
    
    
    
    const cart = await getCart(userId.toString());
    expect(cart).toEqual(mockPopulatedCart);
    expect(Cart.findOne).toHaveBeenCalledWith({ user: userId });
  });

  it('should add an item to the cart', async () => {
    const userId = new mongoose.Types.ObjectId();
    const productId =   new mongoose.Types.ObjectId();
    const item = { productId: productId.toString(), quantity: 2 };
    
    
    const mockProduct = { 
      _id: productId,
      stockQuantity: 5,
      price: 10.99
    };
    
    
    const mockPopulatedCart = { 
      _id: 'mockCartId',
      user: userId,
      items: [{
        product: mockProduct,
        quantity: 2,
        price: 10.99
      }]
    };
    
    (Product.findById as jest.Mock).mockResolvedValue(mockProduct);
    
 
    (Cart.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockPopulatedCart)
    });
    
    const cart = await addToCart(userId.toString(), item);
    
    expect(cart).toEqual(mockPopulatedCart);
    expect(mongoose.startSession).toHaveBeenCalled();

  });

  it('should update an item in the cart', async () => {
    const userId = "1234"
    const productId = new mongoose.Types.ObjectId();
    const item = { productId: productId.toString(), quantity: 3 };
    
    const mockProduct = { 
      _id: productId,
      stockQuantity: 5 
    };
    
    
    const mockCart = { 
      _id: 'mockCartId',
      user: userId,
      items: [{ product: productId, quantity: 1 }],
      save: jest.fn().mockResolvedValue(true)
    };
    
    
    const mockPopulatedCart = {
      _id: 'mockCartId',
      user: userId,
      items: [{ product: mockProduct, quantity: 3 }] 
    };
    
  
    (Product.findById as jest.Mock).mockResolvedValue(mockProduct);
    
   
    (Cart.findOne as jest.Mock).mockReturnValue({
      session: jest.fn().mockReturnValue(mockCart)
    });
    
    (Cart.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockPopulatedCart)
    });
    
    const cart = await updateCartItem(userId.toString(), item);
    
    expect(cart).toEqual(mockPopulatedCart);
    expect(Cart.findOne).toHaveBeenCalledWith({ user: userId });
    expect(mockCart.save).toHaveBeenCalled();
    expect(mongoose.startSession).toHaveBeenCalled();
  });

  it('should remove an item from the cart', async () => {
    const userId = "1234"
    const productId = new mongoose.Types.ObjectId();
    
    
    const mockCart = { 
      _id: 'mockCartId',
      user: userId,
      items: [{ product: productId, quantity: 1 }],
      save: jest.fn().mockResolvedValue(true)
    };
    
    
    const mockPopulatedCart = {
      _id: 'mockCartId',
      user: userId,
      items: [] 
    };
    
  
    (Cart.findOne as jest.Mock).mockResolvedValue(mockCart);
    
   
    (Cart.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockPopulatedCart)
    });
    
    const cart = await removeFromCart(userId.toString(), { productId: productId.toString() });
    
    expect(cart).toEqual(mockPopulatedCart);
    expect(Cart.findOne).toHaveBeenCalledWith({ user: userId });
    expect(mockCart.save).toHaveBeenCalled();
  });
  it('should clear the cart', async () => {
    const userId =  "1234"
    const productId = new mongoose.Types.ObjectId();
    const mockCart = { 
      _id: 'mockCartId',
      user: userId,
      items: [{ product: productId.toString(), quantity: 1 }],
      save: jest.fn().mockResolvedValue(true)
    };

    (Cart.findOne as jest.Mock).mockResolvedValue(mockCart)
  
    await clearCart(userId.toString());

    expect(Cart.findOne).toHaveBeenCalledWith({ user: userId });
    expect(mockCart.items).toEqual([]);
    expect(mockCart.save).toHaveBeenCalled();
   
  });
});