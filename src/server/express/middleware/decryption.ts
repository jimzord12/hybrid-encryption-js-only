import { NextFunction, Request, Response } from 'express';
import { EncryptedData } from '../../../core';
import { isEncryptedData } from '../../../core/common/guards';
import { ServerDecryption } from '../../decrypt';
import { DecryptionError } from '../errors/express.errors';

interface DecryptedRequest extends Request {
  body: {
    data: EncryptedData | unknown;
  };
  decryptedData?: unknown; // Add property to store decrypted data
}

export const decryptMiddleware = async (
  req: DecryptedRequest,
  _res: Response,
  next: NextFunction,
) => {
  const { data: encryptedData } = req.body;

  if (!isEncryptedData(encryptedData)) {
    throw new DecryptionError('Invalid structure of encrypted data format');
  }

  const decryptService = ServerDecryption.getInstance();
  const data = await decryptService.decryptData<unknown>(encryptedData);

  req.body = { data };

  next();
};
