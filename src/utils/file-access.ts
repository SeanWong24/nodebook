export async function getDirectoryHandle(opfs = false) {
  if (opfs) return await self.navigator.storage.getDirectory();
  return await self.showDirectoryPicker();
}
