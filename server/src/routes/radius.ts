import { Router } from 'express';
import { createRadiusUser, getUserData, addCredits, sendPod, sendSMS } from '../services/radius';

const router = Router();

// Proxy endpoints for Radius Manager API

router.post('/create-user', async (req, res) => {
  try {
    const result = await createRadiusUser(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/user/:username', async (req, res) => {
  try {
    const result = await getUserData(req.params.username);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/add-credits', async (req, res) => {
  try {
    const { username, expiry, unit } = req.body;
    const result = await addCredits(username, expiry, unit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/send-sms', async (req, res) => {
  try {
    const { username, message } = req.body;
    const result = await sendSMS(username, message);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
