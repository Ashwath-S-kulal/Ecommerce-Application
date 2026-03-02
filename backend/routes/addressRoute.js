import express from 'express';
import { isAuthenticated } from '../middleware/isAuthenticated.js';
import { addAddress, deleteAddress, editAddress, getAddresses } from '../controller/addressController.js';

const router = express.Router();

router.post('/add',isAuthenticated,addAddress);
router.get('/get',isAuthenticated,getAddresses);
router.put('/update/:id',isAuthenticated,editAddress)
router.delete('/remove/:id',isAuthenticated, deleteAddress)


export default router;

