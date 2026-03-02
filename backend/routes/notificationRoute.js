import express from 'express';
import { isAdmin, isAuthenticated } from '../middleware/isAuthenticated.js';
import { getNotifications, markAllAsRead, markAsRead } from '../controller/notificationController.js';


const router = express.Router();

router.get('/get', isAuthenticated,isAdmin, getNotifications)
router.post('/read/:id', isAuthenticated,isAdmin, markAsRead)
router.post('/allread', isAuthenticated,isAdmin, markAllAsRead)

export default router;