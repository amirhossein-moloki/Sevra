import { Router } from 'express';
import { salonController } from './salon.controller';

const router = Router();

router.post('/', salonController.createSalon);
router.get('/', salonController.getAllSalons);
router.get('/:id', salonController.getSalonById);
router.patch('/:id', salonController.updateSalon);
router.delete('/:id', salonController.deleteSalon);

export default router;
