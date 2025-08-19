import express from 'express';
import publicKeyRoute from './public-key';
import keyRotationRoute from './rotate-keys';
import roundTripTest from './round-trip';

const decryptionRouter = express.Router();

decryptionRouter.use('/public-key', publicKeyRoute);
decryptionRouter.use('/rotate-keys', keyRotationRoute);
decryptionRouter.use('/round-trip', roundTripTest);

export default decryptionRouter;
