import { createOrder, getOrderById, getUserOrders, updateOrderStatus } from '../../src/services/orderservice';
import Order from '../../src/models/order';
import Cart from '../../src/models/cart';
import Product from '../../src/models/product';
import mongoose from 'mongoose';
import { NotFoundError, InsufficientStockError, BadRequestError } from '../../src/utils/errors';
import { redisClient } from '../../src/config/redis';


jest.mock('../../src/models/order', () => {
  const mockOrder = {
    _id: 'mockOrderId',
    user: '1234',
    items: [],
    totalAmount: 0,
    status: 'pending',
    save: jest.fn().mockResolvedValue(true),
    populate: jest.fn().mockReturnThis(),
  };


  const OrderConstructor = jest.fn().mockImplementation(function(data) {
    return {
      ...mockOrder,
      ...data,
      save: jest.fn().mockResolvedValue(true)
    };
  });


  (OrderConstructor as any).findById = jest.fn().mockImplementation(() => {
    return {
      populate: jest.fn().mockResolvedValue(mockOrder)
    };
  });
  
  (OrderConstructor as any).findByIdAndUpdate = jest.fn().mockImplementation(() => {
    return {
      populate: jest.fn().mockResolvedValue({...mockOrder, status: 'shipped'})
    };
  });
  
  (OrderConstructor as any).find = jest.fn().mockImplementation(() => {
    return {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue([mockOrder])
    };
  });
  
  (OrderConstructor as any).countDocuments = jest.fn().mockResolvedValue(1);

  return OrderConstructor;
});


jest.mock('../../src/models/cart', () => {
  const mockCart = {
    _id: 'mockCartId',
    user: '1234',
    items: [{
      product: 'productId',
      quantity: 2,
      price: 10.99
    }],
    save: jest.fn().mockResolvedValue(true),
  };

  return {
    findOne: jest.fn().mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            session: jest.fn().mockReturnValue(mockCart)
          };
        })
      };
    })
  };
});


jest.mock('../../src/models/product', () => {
  
  const createMockProduct = () => ({
    _id: 'productId',
    name: 'Test Product',
    stockQuantity: 5,
    price: 10.99,
    save: jest.fn().mockImplementation((options = {}) => Promise.resolve(true))
  });

  return {
  
    findById: jest.fn().mockImplementation(() => createMockProduct())
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
    Types: {
      ...actualMongoose.Types,
      ObjectId: jest.fn().mockImplementation((id) => id || 'defaultId'),
    },
  };
});


jest.mock('../../src/config/redis', () => ({
  redisClient: {
    del: jest.fn().mockResolvedValue(true),
    setEx: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
  },
}));

describe('Order Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should create an order', async () => {
    const userId = '1234';
    const mockCartItems = [{
      product: 'productId',
      quantity: 2,
      price: 10.99
    }];
    
  
    const mockPopulatedOrder = {
      _id: 'mockOrderId',
      user: userId,
      items: mockCartItems,
      totalAmount: 21.98,
      status: 'pending'
    };

    const mockOrderInstance = {
      _id: 'mockOrderId',
      user: userId,
      items: mockCartItems,
      totalAmount: 21.98,
      status: 'pending',
      save: jest.fn().mockResolvedValue(true)
    };
    
    
    ((Order as unknown) as jest.Mock).mockImplementation(() => mockOrderInstance);
    
    ((Order.findById as unknown) as jest.Mock).mockImplementation(() => {
      return {
        populate: jest.fn().mockResolvedValue(mockPopulatedOrder)
      };
    });

    const order = await createOrder(userId);

    expect(order).toEqual(mockPopulatedOrder);
    expect(mongoose.startSession).toHaveBeenCalled();
    expect(redisClient.del).toHaveBeenCalledWith(`cart:${userId}`);
    expect(redisClient.del).toHaveBeenCalledWith('products:all');
    expect(redisClient.del).toHaveBeenCalledWith(`product:productId`);
  });
  it('should get an order by ID', async () => {
    const userId = '1234';
    const orderId = 'mockOrderId';
    const mockOrder = {
      _id: orderId,
      user: userId,
      items: [],
      totalAmount: 0,
      status: 'pending'
    };

    (redisClient.get as jest.Mock).mockResolvedValue(null);
    (Order.findById as jest.Mock).mockImplementation(() => {
      return {
        populate: jest.fn().mockResolvedValue(mockOrder)
      };
    });

    const order = await getOrderById(orderId, userId);

    expect(order).toEqual(mockOrder);
    expect(Order.findById).toHaveBeenCalledWith(orderId);
    expect(redisClient.setEx).toHaveBeenCalled();
  });

  it('should get user orders with pagination', async () => {
    const userId = '1234';
    const page = 1;
    const limit = 10;
    const mockOrders = [{
      _id: 'mockOrderId',
      user: userId,
      items: [],
      totalAmount: 0,
      status: 'pending'
    }];

    (Order.find as jest.Mock).mockImplementation(() => {
      return {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockOrders)
      };
    });
    (Order.countDocuments as jest.Mock).mockResolvedValue(1);

    const result = await getUserOrders(userId, page, limit);

    expect(result.orders).toEqual(mockOrders);
    expect(result.totalOrders).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(Order.find).toHaveBeenCalledWith({ user: userId });
    expect(Order.countDocuments).toHaveBeenCalledWith({ user: userId });
  });

  it('should update the order status', async () => {
    const orderId = 'mockOrderId';
    const newStatus = 'shipped';
    const mockUpdatedOrder = {
      _id: orderId,
      user: '1234',
      items: [],
      totalAmount: 0,
      status: newStatus
    };

    (Order.findByIdAndUpdate as jest.Mock).mockImplementation(() => {
      return {
        populate: jest.fn().mockResolvedValue(mockUpdatedOrder)
      };
    });

    const order = await updateOrderStatus(orderId, newStatus);

    expect(order).toEqual(mockUpdatedOrder);
    expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(
      orderId, 
      { status: newStatus }, 
      { new: true, runValidators: true }
    );
    expect(redisClient.setEx).toHaveBeenCalled();
  });
});
