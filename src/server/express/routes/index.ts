import express from 'express';
import publicKeyRoute from './public-key.js';
import keyRotationRoute from './rotate-keys.js';
import roundTripTest from './round-trip.js';

const decryptionRouter = express.Router();

decryptionRouter.use('/public-key', publicKeyRoute);
decryptionRouter.use('/rotate-keys', keyRotationRoute);
decryptionRouter.use('/round-trip', roundTripTest);

export default decryptionRouter;
