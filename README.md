# La Galería de Inako (My Love Forever)

Galería fotográfica oscura, moderna y responsive, construida en HTML, CSS y JavaScript puros.

## Añadir fotos

1. Copia las imágenes a la carpeta `fotos/`. Las subcarpetas se convierten automáticamente en filtros de colección.
2. Ejecuta `npm run galeria` para regenerar el catálogo (`fotos.json`). El script admite carpetas, GIFs y nombres con espacios, tildes o caracteres especiales.
3. Abre `index.html` mediante un servidor local.

En GitHub, el workflow `Actualizar catálogo de fotos` regenera automáticamente `fotos.json` cada vez que se sube o modifica algo dentro de `fotos/`. Así GitHub Pages encuentra las imágenes aunque estén dentro de subcarpetas. Espera a que termine la acción antes de recargar la página.

```bash
npm run galeria
npm run serve
```

Visita `http://localhost:4173`. La web admite JPG, JPEG, PNG, WEBP, GIF y AVIF.

También puedes usar **Elegir carpeta** en el estado vacío para cargar una carpeta directamente en el navegador. Esa opción sirve como previsualización y no sube ni modifica las fotografías.
