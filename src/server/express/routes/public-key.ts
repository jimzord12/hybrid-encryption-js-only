import express from 'express';
import { ServerDecryption } from '../../decrypt';

const publicKeyRoute = express.Router();

publicKeyRoute.get('/', async (_, res) => {
  const serverDecryption = ServerDecryption.getInstance();
  const publicKey = await serverDecryption.getPublicKeyBase64();
  res.json({ publicKey });
});

export default publicKeyRoute;
