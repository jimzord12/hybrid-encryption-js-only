import express from 'express';
import { ServerDecryption } from '../../decrypt';

const keyRotationRoute = express.Router();

keyRotationRoute.post('/', async (_, res) => {
  const serverDecryption = ServerDecryption.getInstance();
  await serverDecryption.rotateKeys();
  res.sendStatus(204);
});

export default keyRotationRoute;
