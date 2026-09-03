let pendingScan: File | null = null

export function setPendingScan(file: File) {
  pendingScan = file
}

export function takePendingScan(): File | null {
  const file = pendingScan
  pendingScan = null
  return file
}
