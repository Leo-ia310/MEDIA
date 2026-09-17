# AIAME · Frontend

Interfaz web tipo chat IA. Solo frontend por ahora; preparada para conectar un agente de IA real más adelante.

## Estructura

```
AIAME/
├── index.html        # Estructura de la página (sidebar, header, mensajes, composer)
├── styles.css        # Estilos, tokens de color (azul/blanco), tema claro/oscuro, responsive
├── app.js            # Lógica: estado, render de chats/mensajes, envío, tema
├── assets/
│   ├── logo.svg      # Logo temporal de AIAME
│   └── fonts/        # (vacío) coloca aquí Etrixo/Jubble/Ritteru en .woff2
└── README.md
```

## Cómo verlo

Abre `index.html` en el navegador, o sirve la carpeta:

```bash
npx serve .
```

## Conectar el agente IA real

Todo pasa por **una sola función** en `app.js`:

```js
async function getAgentResponse(messages) { ... }
```

Hoy devuelve un mock. Sustituye su cuerpo por la llamada a tu backend/API
(hay un ejemplo comentado en el propio archivo). La UI no necesita cambios.

Para respuestas en **streaming** (token a token) ya existe `appendStreaming()`.

## Tipografías

Orden de prioridad: **Etrixo → Jubble → Ritteru → Poppins/Inter** (fallback).

Estas tres primeras no están en bibliotecas abiertas comunes. Cuando tengas
los archivos:

1. Copia los `.woff2` en `assets/fonts/`.
2. Descomenta los bloques `@font-face` al inicio de `styles.css`.

## Paleta

Azul + blanco. Todos los colores son variables CSS en `:root` (`styles.css`),
fáciles de ajustar. Incluye tema oscuro con `data-theme="dark"`.

## Pendiente / ideas futuras

- Persistencia del historial (localStorage o backend).
- Autenticación de usuario.
- Renderizado de Markdown en las respuestas.
- Adjuntar archivos / imágenes.
- Logo definitivo (el actual es temporal).
