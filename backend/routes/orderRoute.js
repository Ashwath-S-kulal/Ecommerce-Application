import express from 'express';
import { isAdmin, isAuthenticated } from '../middleware/isAuthenticated.js';
import { cancelOrder, createOrder, getAllOrders, getOrderById, getUserOrders, updateOrderStatusAdmin } from '../controller/orderController.js';

const router = express.Router();

router.post('/create',isAuthenticated, createOrder);
router.get('/getallorders', isAuthenticated,isAdmin, getAllOrders)
router.get('/getuserorder' , isAuthenticated, getUserOrders)
router.get('/getorder/:orderId' , isAuthenticated,isAdmin, getOrderById)
router.post('/cancelorder/:orderId' , isAuthenticated, cancelOrder)
router.post('/updateorderstatusadmin/:orderId' , isAuthenticated,isAdmin, updateOrderStatusAdmin)






export default router;