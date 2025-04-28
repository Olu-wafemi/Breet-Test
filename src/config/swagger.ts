import swaggerJSDoc from 'swagger-jsdoc';
import dotenv from 'dotenv';


dotenv.config();


const LOCAL_API_URL = 'http://localhost:9000';
const DEV_API_URL = process.env.DEV_API_URL || LOCAL_API_URL;

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Shopping Cart API',
    version: '1.0.0',
    description: 'API documentation for the Shopping Cart system'
  },
  servers: [
    //{ url: LOCAL_API_URL, description: 'Local server' },
    { url: DEV_API_URL, description: 'Development server' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'testuser@example.com' },
          password: {type: 'string', example: 'securePassword123!'},
          role: { type: 'string', enum: ['admin', 'customer'], example: 'customer' }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/User' }
        }
      },
      Product: {
        type: 'object',
        required: ['name', 'description', 'price', 'stockQuantity', 'category'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          stockQuantity: { type: 'integer' },
          category: { type: 'string' },
          imageUrl: { type: 'string', format: 'url' }
        }
      },
      CartItem: {
        type: 'object',
        properties: {
          product: { $ref: '#/components/schemas/Product' },
          quantity: { type: 'integer', example: 2 },
          price: { type: 'number', example: 129.99 }
        }
      },
      Cart: {
        type: 'object',
        properties: {
          user: { type: 'string' },
          items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } }
        }
      },
      OrderItem: {
        type: 'object',
        properties: {
          product: { $ref: '#/components/schemas/Product' },
          quantity: { type: 'integer', example: 2 },
          price: { type: 'number', example: 129.99 }
        }
      },
      Order: {
        type: 'object',
        properties: {
          user: { type: 'string' },
          items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
          totalAmount: { type: 'number' },
          status: { type: 'string', enum: ['pending','processing','completed','cancelled'] }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'BAD_REQUEST' },
              message: { type: 'string', example: 'Error message description' },
              details: { type: 'object', nullable: true }
            }
          }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': { 
              schema: { $ref: '#/components/schemas/User' },
              example: {
                name: 'John Doe',
                email: 'testuser@example.com',
                password: 'securePassword123!',
                role: 'customer'
              }
            }
          }
        },
        responses: {
          '201': { 
            description: 'User registered successfully', 
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } 
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '409': {
            description: 'Email already exists',
            content: { 'application/json': { 
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: {
                  code: "CONFLICT",
                  message: "User with this email already exists"
                }
              }
            } }
          },
          '500': {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and obtain JWT',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { 
                  email: { type: 'string', example: 'testuser@example.com' }, 
                  password: { type: 'string', example: 'securePassword123!' } 
                }
              }
            }
          }
        },
        responses: { 
          '200': { 
            description: 'Login successful', 
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } 
          },
          '401': {
            description: 'Invalid credentials',
            content: { 'application/json': { 
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: {
                  code: "UNAUTHORIZED",
                  message: "Invalid email or password"
                }
              } 
            } }
          },
          '500': {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          }
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: { 
          '200': { 
            description: 'User profile', 
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } 
          },
          '401': {
            description: 'Unauthorized - Invalid or expired token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          }
        }
      }
    },

    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'List products with pagination and filtering',
        security: [],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 }, description: 'Items per page' },
          { in: 'query', name: 'category', schema: { type: 'string' }, description: 'Filter by category' },
          { in: 'query', name: 'minPrice', schema: { type: 'number' }, description: 'Minimum price filter' },
          { in: 'query', name: 'maxPrice', schema: { type: 'number' }, description: 'Maximum price filter' },
          { in: 'query', name: 'sort', schema: { type: 'string', enum: ['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest'] }, description: 'Sort order' }
        ],
        responses: { 
          '200': { 
            description: 'A list of products with pagination info', 
            content: { 'application/json': { 
              schema: { 
                type: 'object',
                properties: {
                  products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                  totalProducts: { type: 'integer', example: 50 },
                  totalPages: { type: 'integer', example: 5 }
                }
              } 
            } } 
          },
          '500': {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          }
        }
      },
      post: {
        tags: ['Products'],
        summary: 'Create a product (Admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: { 
          required: true, 
          content: { 'application/json': { 
            schema: { $ref: '#/components/schemas/Product' },
            example: {
              name: 'Wireless Headphones',
              description: 'Premium noise-cancelling wireless headphones with 20hr battery life',
              price: 129.99,
              stockQuantity: 50,
              category: 'Electronics',
              imageUrl: 'https://example.com/images/headphones.jpg'
            }
          } } 
        },
        responses: { 
          '201': { 
            description: 'Product created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } }
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '403': {
            description: 'Forbidden - Not an admin',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          }
        }
      }
    },
    '/api/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get a product by ID',
        security: [],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Product ID' }],
        responses: { 
          '200': { 
            description: 'Product data', 
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } 
          },
          '404': {
            description: 'Product not found',
            content: { 'application/json': { 
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: {
                  code: "NOT_FOUND",
                  message: "Product with ID 6425e8dab8a0d56d60e3c5a1 not found"
                }
              } 
            } }
          }
        }
      },
      put: {
        tags: ['Products'],
        summary: 'Update a product (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Product ID' }],
        requestBody: { 
          required: true, 
          content: { 'application/json': { 
            schema: { $ref: '#/components/schemas/Product' } 
          } } 
        },
        responses: { 
          '200': { 
            description: 'Product updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } }
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '403': {
            description: 'Forbidden - Not an admin',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '404': {
            description: 'Product not found',
            content: { 'application/json': { 
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: {
                  code: "NOT_FOUND",
                  message: "Product with ID 6425e8dab8a0d56d60e3c5a1 not found"
                }
              } 
            } }
          }
        }
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete a product (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Product ID' }],
        responses: { 
          '200': { 
            description: 'Product deleted',
            content: { 'application/json': { 
              schema: { 
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Product deleted successfully' }
                }
              } 
            } }
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '403': {
            description: 'Forbidden - Not an admin',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '404': {
            description: 'Product not found',
            content: { 'application/json': { 
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: {
                  code: "NOT_FOUND",
                  message: "Product with ID 6425e8dab8a0d56d60e3c5a1 not found"
                }
              } 
            } }
          }
        }
      }
    },

    '/api/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Get current user cart',
        security: [{ bearerAuth: [] }],
        responses: { 
          '200': { 
            description: 'Cart data', 
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Cart' } } } 
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          }
        }
      },
      delete: {
        tags: ['Cart'],
        summary: 'Clear cart',
        security: [{ bearerAuth: [] }],
        responses: { 
          '200': { 
            description: 'Cart cleared',
            content: { 'application/json': { 
              schema: { 
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Cart cleared successfully' }
                }
              } 
            } }
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          }
        }
      }
    },
    '/api/cart/add': {
      post: {
        tags: ['Cart'],
        summary: 'Add item to cart',
        security: [{ bearerAuth: [] }],
        requestBody: { 
          required: true, 
          content: { 'application/json': { 
            schema: { 
              type: 'object', 
              required: ['productId', 'quantity'],
              properties: { 
                productId: { type: 'string', example: '6425e8dab8a0d56d60e3c5a1' }, 
                quantity: { type: 'integer', example: 2, minimum: 1 } 
              } 
            },
            example: {
              productId: '6425e8dab8a0d56d60e3c5a1',
              quantity: 2
            }
          } } 
        },
        responses: { 
          '200': { 
            description: 'Item added', 
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Cart' } } } 
          },
          '400': {
            description: 'Invalid input or insufficient stock',
            content: { 'application/json': { 
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: {
                  code: "INSUFFICIENT_STOCK",
                  message: "Not enough stock available. Requested: 5, Available: 2"
                }
              }
            } }
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '404': {
            description: 'Product not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          }
        }
      }
    },
    '/api/cart/update': {
      put: {
        tags: ['Cart'],
        summary: 'Update cart item quantity',
        security: [{ bearerAuth: [] }],
        requestBody: { 
          required: true, 
          content: { 'application/json': { 
            schema: { 
              type: 'object', 
              required: ['productId', 'quantity'],
              properties: { 
                productId: { type: 'string', example: '6425e8dab8a0d56d60e3c5a1' }, 
                quantity: { type: 'integer', example: 3, minimum: 1 } 
              } 
            } 
          } } 
        },
        responses: { 
          '200': { 
            description: 'Cart updated', 
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Cart' } } } 
          },
          '400': {
            description: 'Invalid input or insufficient stock',
            content: { 'application/json': { 
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: {
                  code: "INSUFFICIENT_STOCK",
                  message: "Not enough stock available. Requested: 5, Available: 2"
                }
              }
            } }
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '404': {
            description: 'Product not found in cart',
            content: { 'application/json': { 
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: {
                  code: "NOT_FOUND",
                  message: "Item with product ID 6425e8dab8a0d56d60e3c5a1 not found in cart"
                }
              }
            } }
          }
        }
      }
    },
    '/api/cart/remove': {
      post: {
        tags: ['Cart'],
        summary: 'Remove item from cart',
        security: [{ bearerAuth: [] }],
        requestBody: { 
          required: true, 
          content: { 'application/json': { 
            schema: { 
              type: 'object',
              required: ['productId'],
              properties: { 
                productId: { type: 'string', example: '6425e8dab8a0d56d60e3c5a1' } 
              } 
            } 
          } } 
        },
        responses: { 
          '200': { 
            description: 'Item removed', 
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Cart' } } } 
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '404': {
            description: 'Product not found in cart',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          }
        }
      }
    },

    '/api/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Create order from cart',
        security: [{ bearerAuth: [] }],
        responses: { 
          '201': { 
            description: 'Order created', 
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } 
          },
          '400': {
            description: 'Cart is empty or invalid input',
            content: { 'application/json': { 
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: {
                  code: "BAD_REQUEST",
                  message: "Cart is empty"
                }
              }
            } }
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '422': {
            description: 'Insufficient stock',
            content: { 'application/json': { 
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: {
                  code: "INSUFFICIENT_STOCK",
                  message: "Not enough stock for product Wireless Mouse. Available: 2, Requested: 5"
                }
              }
            } }
          }
        }
      },
      get: {
        tags: ['Orders'],
        summary: 'List user orders',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 }, description: 'Items per page' }
        ],
        responses: { 
          '200': { 
            description: 'Orders list with pagination', 
            content: { 'application/json': { 
              schema: { 
                type: 'object', 
                properties: {
                  orders: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
                  totalOrders: { type: 'integer', example: 12 },
                  totalPages: { type: 'integer', example: 2 }
                }
              } 
            } } 
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          }
        }
      }
    },
    '/api/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', schema: { type: 'string' }, required: true, description: 'Order ID' }],
        responses: { 
          '200': { 
            description: 'Order data', 
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } 
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '404': {
            description: 'Order not found',
            content: { 'application/json': { 
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: {
                  code: "NOT_FOUND",
                  message: "Order with ID 6425e8dab8a0d56d60e3c5a1 not found"
                }
              }
            } }
          }
        }
      }
    },
    '/api/orders/{id}/status': {
      put: {
        tags: ['Orders'],
        summary: 'Update order status (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Order ID' }],
        requestBody: { 
          required: true, 
          content: { 'application/json': { 
            schema: { 
              type: 'object',
              required: ['status'],
              properties: { 
                status: { 
                  type: 'string', 
                  enum: ['pending','processing','completed','cancelled'],
                  example: 'processing'
                } 
              } 
            } 
          } } 
        },
        responses: { 
          '200': { 
            description: 'Order status updated', 
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } 
          },
          '400': {
            description: 'Invalid status value',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '403': {
            description: 'Forbidden - Not an admin',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '404': {
            description: 'Order not found',
            content: { 'application/json': { 
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: {
                  code: "NOT_FOUND",
                  message: "Order with ID 6425e8dab8a0d56d60e3c5a1 not found"
                }
              }
            } }
          }
        }
      }
    },
  }
};

const options = {
  swaggerDefinition,
  apis: [] 
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
