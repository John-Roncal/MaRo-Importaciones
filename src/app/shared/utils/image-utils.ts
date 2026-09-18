// Redimensiona una imagen (logo de sucursal, foto de producto, etc.) a un
// ancho máximo antes de guardarla como base64 -- evita subir fotos enormes
// sin comprimir a la base de datos.
export function redimensionarImagenABase64(
  archivo: File,
  anchoMax: number,
  formato: 'image/png' | 'image/jpeg' = 'image/jpeg'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, anchoMax / img.width);
        const ancho = Math.round(img.width * escala);
        const alto = Math.round(img.height * escala);
        const canvas = document.createElement('canvas');
        canvas.width = ancho;
        canvas.height = alto;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo procesar la imagen'));
          return;
        }
        ctx.drawImage(img, 0, 0, ancho, alto);
        resolve(canvas.toDataURL(formato, 0.85));
      };
      img.onerror = () => reject(new Error('Imagen inválida'));
      img.src = lector.result as string;
    };
    lector.onerror = () => reject(new Error('No se pudo leer el archivo'));
    lector.readAsDataURL(archivo);
  });
}