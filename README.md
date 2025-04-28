# Shopping Cart API

## API Documentation

**Live API Documentation: [https://breet-backend-test.onrender.com/docs/](https://breet-backend-test.onrender.com/docs/)**

The API is fully documented using Swagger. Access the interactive API documentation at the link above to explore all endpoints, request/response formats, and test the API directly.

## Technical Challenges Addressed

### 1. Concurrent Operations
- MongoDB transactions ensure atomicity for critical operations
- Optimistic concurrency control for order processing


### 2. Caching Strategy
- Redis caching for frequently accessed data
- Different TTL values based on data change frequency
- Intelligent cache invalidation on data updates
- Separate caching strategies for lists vs individual entities

### 3. Query Optimization
- Pagination implemented for all list endpoints
- MongoDB indexes for common query patterns
- Text indexes for efficient search operations
- Projection to limit returned fields when appropriate
- Parallel query execution with Promise.all

### 4. Data Consistency
- Atomic transactions for multi-document operations
- Proper stock validation before cart/order operations
- Cache invalidation on data mutations
- Strong schema validation using Zod

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (v5+)
- Redis (v6+)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Olu-wafemi/Breet-Test.git
   cd shopping-cart-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   ```
   PORT=9000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@<host>/<database>
   REDIS_HOST=<redis-host>
   REDIS_PORT=<redis-port>
   REDIS_PASSWORD=<redis-password>
   DEV_API_URL=https://breet-backend-test.onrender.com
   JWT_SECRET=<your-jwt-secret>
   JWT_EXPIRES_IN=1d
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Access the API documentation at:
   ```
   https://breet-backend-test.onrender.com/docs

   http://localhost:9000/docs
   ```

### Running Tests
- Run all tests:
  ```bash
  npm test
  ```

## API Documentation

The API is fully documented using Swagger. When the server is running, access the interactive API documentation at `/docs`.

### Key Endpoints

#### Authentication
| Method | Endpoint             | Description                   | Auth Required |
|--------|----------------------|-------------------------------|---------------|
| POST   | `/api/auth/register` | Register a new user           | No            |
| POST   | `/api/auth/login`    | Login and obtain JWT token    | No            |
| GET    | `/api/auth/me`       | Get current user profile      | Yes           |

#### Products
| Method | Endpoint                 | Description                       | Auth Required |
|--------|--------------------------|-----------------------------------|---------------|
| GET    | `/api/products`          | List products with pagination     | No            |
| GET    | `/api/products/:id`      | Get product details               | No            |
| POST   | `/api/products`          | Create a new product              | Yes (Admin)   |
| PUT    | `/api/products/:id`      | Update a product                  | Yes (Admin)   |
| DELETE | `/api/products/:id`      | Delete a product                  | Yes (Admin)   |


#### Cart
| Method | Endpoint             | Description                   | Auth Required |
|--------|----------------------|-------------------------------|---------------|
| GET    | `/api/cart`          | Get current user's cart       | Yes           |
| POST   | `/api/cart/add`      | Add item to cart              | Yes           |
| PUT    | `/api/cart/update`   | Update cart item quantity     | Yes           |
| POST   | `/api/cart/remove`   | Remove item from cart         | Yes           |
| DELETE | `/api/cart`          | Clear cart                    | Yes           |

#### Orders
| Method | Endpoint                 | Description                       | Auth Required |
|--------|--------------------------|-----------------------------------|---------------|
| POST   | `/api/orders`            | Create order from cart            | Yes           |
| GET    | `/api/orders`            | List user orders with pagination  | Yes           |
| GET    | `/api/orders/:id`        | Get order details                 | Yes           |
| PUT    | `/api/orders/:id/status` | Update order status               | Yes (Admin)   |

## Design Assumptions

### Authentication
- JWT tokens are used for authentication with a 1-day expiration
- Two user roles exist: customer and admin
- Email addresses must be unique and are used for login
- Passwords are hashed using bcrypt before storage

### Products
- Products have a minimum price of 0 (free items allowed)
- Stock quantity cannot be negative
- Each product belongs to a single category
- Products can be searched by name and description

### Cart
- Each user has only one active cart
- Cart items store the price at time of addition (not dynamic pricing)
- Quantity must be at least 1 for all cart items
- Cart is retained between sessions until order is created

### Orders
- Orders are created from cart data
- Order items maintain the price at time of purchase (price snapshots)
- Orders follow a specific lifecycle through status changes
- Total amount is calculated and stored at order creation
- Orders are permanent records and cannot be deleted

## Project Structure
```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── middleware/     # Express middlewares
├── models/         # Mongoose schemas
├── routes/         # API route definitions
├── schemas/        # Zod validation schemas
├── services/       # Business logic
└── utils/          # Utility functions
```



## API Reference
| Method | Endpoint                | Description                       |
|--------|-------------------------|-----------------------------------|
| POST   | `/api/auth/register`    | Register a new user               |
| POST   | `/api/auth/login`       | Login & retrieve JWT              |
| POST   | `/api/cart/add`         | Add item to cart                  |
| POST   | `/api/orders`           | Checkout current cart             |
| PUT    | `/api/orders/:id/status`| Update order status (admin only)  |