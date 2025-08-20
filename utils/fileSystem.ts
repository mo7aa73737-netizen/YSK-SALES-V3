// utils/fileSystem.ts

// Add types for File System Access API to fix compilation errors.
type PermissionMode = 'read' | 'readwrite';

interface FileSystemHandlePermissionDescriptor {
  mode?: PermissionMode;
}

type PermissionState = 'granted' | 'denied' | 'prompt';

// This is a simplified definition to satisfy the compiler.
interface FileSystemWritableFileStream extends WritableStream {
    write(data: any): Promise<void>;
}

// Type definitions for the File System Access API
interface FileSystemDirectoryHandle {
  kind: 'directory';
  name: string;
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  keys(): AsyncIterable<string>;
}

interface FileSystemFileHandle {
    kind: 'file';
    name: string;
    createWritable(): Promise<FileSystemWritableFileStream>;
    getFile(): Promise<File>;
}

// --- File System Access API Helpers ---

/**
 * Verifies or requests permission for a directory handle.
 * @returns {Promise<boolean>} - True if permission is granted.
 */
export async function verifyPermission(dirHandle: FileSystemDirectoryHandle): Promise<boolean> {
    const options = { mode: 'readwrite' as PermissionMode };
    try {
        if ((await dirHandle.queryPermission(options)) === 'granted') {
            return true;
        }
        if ((await dirHandle.requestPermission(options)) === 'granted') {
            return true;
        }
    } catch (error) {
        console.error("Error verifying permission:", error);
    }
    return false;
}

/**
 * Prompts the user to select a directory.
 * @returns {Promise<FileSystemDirectoryHandle | null>}
 */
export async function selectDirectory(): Promise<FileSystemDirectoryHandle | null> {
    try {
        const handle = await (window as any).showDirectoryPicker();
        return handle;
    } catch (error) {
        // This error is common if the user cancels the picker.
        if (error instanceof DOMException && error.name === 'AbortError') {
             console.log("User cancelled directory picker.");
        } else {
            console.error("Error selecting directory:", error);
        }
        return null;
    }
}

/**
 * Reads data from a file in the given directory.
 * @param dirHandle The directory handle.
 * @param fileName The name of the file to read.
 * @returns {Promise<T | null>} The parsed JSON data or null if not found/error.
 */
export async function readFile<T>(dirHandle: FileSystemDirectoryHandle, fileName: string): Promise<T | null> {
    try {
        const fileHandle = await dirHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const content = await file.text();
        return JSON.parse(content) as T;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') {
             return null;
        }
        console.error(`Error reading file ${fileName}:`, error);
        return null;
    }
}

/**
 * Writes data to a file in the given directory.
 * @param dirHandle The directory handle.
 * @param fileName The name of the file to write to.
 * @param data The data to write (will be JSON.stringified).
 */
export async function writeFile(dirHandle: FileSystemDirectoryHandle, fileName: string, data: any): Promise<void> {
    try {
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
    } catch (error) {
        console.error(`Error writing file ${fileName}:`, error);
    }
}