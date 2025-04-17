export async function setBlob(
  directoryHandle: FileSystemDirectoryHandle,
  path: string,
  blob: Blob
) {
  const fileHandle = await directoryHandle.getFileHandle(path, {
    create: true,
  });
  const writable = await fileHandle.createWritable();
  writable.write(blob);
  writable.close();
}

export async function getBlob(
  directoryHandle: FileSystemDirectoryHandle,
  path: string
) {
  const fileHandle = await directoryHandle.getFileHandle(path);
  return await fileHandle?.getFile();
}
