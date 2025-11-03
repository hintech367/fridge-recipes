import { Router } from 'express';
import PantryController from '../controllers/pantryController';

const router = Router();
const pantryController = new PantryController();

// Define API routes
router.get('/pantry-items', pantryController.getAllItems.bind(pantryController));
router.post('/pantry-items', pantryController.addItem.bind(pantryController));
router.put('/pantry-items/:id', pantryController.updateItem.bind(pantryController));
router.delete('/pantry-items/:id', pantryController.deleteItem.bind(pantryController));

export default router;