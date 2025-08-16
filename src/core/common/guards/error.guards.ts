import { FileSystemError } from '../errors/interfaces/filesystem.interfaces';

export const isFSError = (value: unknown): value is FileSystemError =>
  typeof value === 'object' &&
  value !== null &&
  'code' in value &&
  'errno' in value &&
  'syscall' in value &&
  'path' in value;
