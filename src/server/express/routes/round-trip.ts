import express, { type Request, Response } from 'express';
import { expectDeepEqual } from '../../../../tests/setup/test-utils';
import { EncryptedData } from '../../../core';
import { ServerDecryption } from '../../decrypt';

const roundTripTest = express.Router();

const expectedMessage = {
  message: 'Round trip successful',
  data: {
    sensitiveData: {
      card: '1234-5678-9012-3456',
      name: 'John Doe',
      age: 123,
    },
  },
};

type RequestBody = {
  encryptedData: EncryptedData;
};
type ResponseBody = {
  ok: boolean;
};

roundTripTest.post(
  '/',
  async (req: Request<{}, ResponseBody, RequestBody>, res: Response<ResponseBody>) => {
    const { encryptedData } = req.body;

    const serverDecryption = ServerDecryption.getInstance();
    const decryptedData = await serverDecryption.decryptData<typeof expectedMessage>(encryptedData);

    try {
      expectDeepEqual(decryptedData, expectedMessage);
      return res.json({ ok: true });
    } catch (error) {
      console.error('Decryption failed:', error);
      return res.status(400).json({ ok: false });
    }
  },
);

export default roundTripTest;
