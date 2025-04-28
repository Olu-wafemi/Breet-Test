import { Router } from "express";

import authRouter from './authroute'
import cartRouter from './cartroute'
import orderRouter from './orderoute'
import productRouter from './productroute'

const indexRouter = Router()

indexRouter.use('/auth', authRouter)
indexRouter.use('/cart', cartRouter)
indexRouter.use('/orders', orderRouter)
indexRouter.use('/products', productRouter)

export  default indexRouter