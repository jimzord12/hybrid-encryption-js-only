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
  try {
    let { data } = req.body;

    if (typeof data === 'string' && data.includes('encryptedContent')) data = JSON.parse(data);

    if (!isEncryptedData(data)) {
      throw new DecryptionError('Invalid structure of encrypted data format');
    }

    const decryptService = ServerDecryption.getInstance();
    const decryptedData = await decryptService.decryptData<unknown>(data);

    req.body = { data: decryptedData };

    next();
  } catch (error) {
    next(error);
  }
};
