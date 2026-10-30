/**
 * Recorta una imagen al centro y la convierte en un avatar JPEG de 256x256.
 * Se usa en el CRUD de usuarios y en el perfil del especialista.
 */
export async function fileToAvatar(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("canvas_unavailable");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);

  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  const x = (size - width) / 2;
  const y = (size - height) / 2;

  context.drawImage(bitmap, x, y, width, height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.82);
}
