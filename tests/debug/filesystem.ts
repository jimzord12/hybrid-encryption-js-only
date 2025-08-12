import fs from 'fs/promises';
import os from 'os';
import path from 'path';

export async function directoryExists(path: string): Promise<boolean> {
  try {
    await fs.access(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function getDirectoryPermissions(dirPath: string) {
  try {
    const stats = await fs.stat(dirPath);

    // Check if it's actually a directory
    if (!stats.isDirectory()) {
      throw new Error(`${dirPath} is not a directory`);
    }

    const platform = os.platform();
    const mode = stats.mode;

    // Extract permission bits (last 9 bits for Unix-like systems)
    const permissions = mode & parseInt('777', 8);

    // Convert to octal string
    const octal = permissions.toString(8).padStart(3, '0');

    // Parse individual permission bits
    const owner = {
      read: !!(permissions & 0o400),
      write: !!(permissions & 0o200),
      execute: !!(permissions & 0o100),
    };

    const group = {
      read: !!(permissions & 0o040),
      write: !!(permissions & 0o020),
      execute: !!(permissions & 0o010),
    };

    const others = {
      read: !!(permissions & 0o004),
      write: !!(permissions & 0o002),
      execute: !!(permissions & 0o001),
    };

    // Check actual access for current user
    const access = {
      readable: false,
      writable: false,
      executable: false,
    };

    try {
      await fs.access(dirPath, fs.constants.R_OK);
      access.readable = true;
    } catch {}

    try {
      await fs.access(dirPath, fs.constants.W_OK);
      access.writable = true;
    } catch {}

    try {
      await fs.access(dirPath, fs.constants.X_OK);
      access.executable = true;
    } catch {}

    return {
      path: path.resolve(dirPath),
      platform,
      mode: {
        octal,
        decimal: permissions,
        string: modeToString(permissions),
      },
      permissions: {
        owner,
        group,
        others,
      },
      currentUserAccess: access,
      isDirectory: true,
      lastModified: stats.mtime,
      created: stats.birthtime || stats.ctime,
    };
  } catch (error) {
    throw new Error(`Failed to get permissions for ${dirPath}: ${(error as Error).message}`);
  }
}

/**
 * Convert numeric mode to string representation (like ls -l)
 * @param {number} mode - Permission mode
 * @returns {string} - String representation (e.g., "rwxr-xr-x")
 */
function modeToString(mode: number) {
  const chars = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];

  const owner = chars[(mode >> 6) & 7];
  const group = chars[(mode >> 3) & 7];
  const others = chars[mode & 7];

  return owner + group + others;
}

// /**
//  * Synchronous version of getDirectoryPermissions
//  * @param {string} dirPath - Path to the directory
//  * @returns {Object} - Object containing permission information
//  */
// function getDirectoryPermissionsSync(dirPath: string) {
//   try {
//     const stats = fsSync.statSync(dirPath);

//     if (!stats.isDirectory()) {
//       throw new Error(`${dirPath} is not a directory`);
//     }

//     const platform = os.platform();
//     const mode = stats.mode;
//     const permissions = mode & parseInt('777', 8);
//     const octal = permissions.toString(8).padStart(3, '0');

//     const owner = {
//       read: !!(permissions & 0o400),
//       write: !!(permissions & 0o200),
//       execute: !!(permissions & 0o100),
//     };

//     const group = {
//       read: !!(permissions & 0o040),
//       write: !!(permissions & 0o020),
//       execute: !!(permissions & 0o010),
//     };

//     const others = {
//       read: !!(permissions & 0o004),
//       write: !!(permissions & 0o002),
//       execute: !!(permissions & 0o001),
//     };

//     const access = {
//       readable: false,
//       writable: false,
//       executable: false,
//     };

//     try {
//       fs.accessSync(dirPath, fs.constants.R_OK);
//       access.readable = true;
//     } catch {}

//     try {
//       fs.accessSync(dirPath, fs.constants.W_OK);
//       access.writable = true;
//     } catch {}

//     try {
//       fs.accessSync(dirPath, fs.constants.X_OK);
//       access.executable = true;
//     } catch {}

//     return {
//       path: path.resolve(dirPath),
//       platform,
//       mode: {
//         octal,
//         decimal: permissions,
//         string: modeToString(permissions),
//       },
//       permissions: {
//         owner,
//         group,
//         others,
//       },
//       currentUserAccess: access,
//       isDirectory: true,
//       lastModified: stats.mtime,
//       created: stats.birthtime || stats.ctime,
//     };
//   } catch (error) {
//     throw new Error(`Failed to get permissions for ${dirPath}: ${error.message}`);
//   }
// }
