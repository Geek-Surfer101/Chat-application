import express from 'express';
import { protectRoute } from '../middleware/auth.js';
import {
  sendInvitation,
  listInvitations,
  acceptInvitation,
  rejectInvitation
} from '../controllers/invitationController.js';

const invitationRouter = express.Router();

invitationRouter.post('/send', protectRoute, sendInvitation);
invitationRouter.get('/list', protectRoute, listInvitations);
invitationRouter.post('/accept', protectRoute, acceptInvitation);
invitationRouter.post('/reject', protectRoute, rejectInvitation);

export default invitationRouter;
