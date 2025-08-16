export interface FileSystemError extends Error {
  code?: string;
  errno?: number;
  syscall?: string;
  path?: string;
}
