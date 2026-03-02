import express from 'express';
import { isAuthenticated } from '../middleware/isAuthenticated.js';
import { addToWishlist, getWishlist, removeFromWishlist } from '../controller/wishlistController.js';

const router = express.Router();

router.get('/get',isAuthenticated,getWishlist);
router.post('/add',isAuthenticated,addToWishlist);
router.delete('/remove',isAuthenticated, removeFromWishlist)


export default router;