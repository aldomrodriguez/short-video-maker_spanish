# 🎬 Short Video Maker — Edición en Español

> Fork de [gyoridavid/short-video-maker](https://github.com/gyoridavid/short-video-maker) adaptado para generar videos con voz y subtítulos en **español**.

Herramienta de código abierto para la creación automática de videos cortos con voz en español, subtítulos automáticos, videos de fondo y música de ambiente — todo local, sin coste de API de IA y sin GPU necesaria.

Este fork modifica el proyecto original para:
- 🇪🇸 Usar **voces en español** (Kokoro TTS: `ef_dora`, `em_alex`, `em_santa`)
- 🎙️ Transcribir audio en español con **Whisper multilingüe** (`medium`)
- 🐳 Incluir `espeak-ng` en los Dockerfiles (necesario para fonética en español)

El servidor expone tanto una API REST como un servidor [MCP](https://github.com/modelcontextprotocol), compatible con n8n y otros agentes de IA.

---

## 📋 Índice

### Inicio rápido
- [Requisitos](#requisitos)
- [Cómo ejecutarlo](#cómo-ejecutarlo)
- [Web UI](#web-ui)
- [Integración con n8n](#n8n)

### Referencia
- [Variables de entorno](#variables-de-entorno)
- [API REST](#api-rest)
- [Opciones de configuración](#opciones-de-configuración)
- [Servidor MCP](#servidor-mcp)

### Información
- [Características](#características)
- [Cómo funciona](#cómo-funciona)
- [Voces disponibles en español](#voces-disponibles-en-español)
- [Limitaciones](#limitaciones)
- [Conceptos](#conceptos)
- [Solución de problemas](#solución-de-problemas)
- [Despliegue en la nube](#despliegue-en-la-nube)
- [FAQ](#faq)
- [Dependencias](#dependencias)
- [Licencia](#licencia)
- [Créditos](#créditos)

---

## Características

- Generación completa de videos cortos a partir de texto
- **Texto a voz en español** (Kokoro TTS)
- Subtítulos automáticos en español (Whisper multilingüe)
- Búsqueda y selección automática de videos de fondo via Pexels
- Música de fondo con selección por estado de ánimo
- API REST y servidor MCP para integración con agentes de IA

---

## Cómo funciona

1. Convierte el texto a voz en español usando **Kokoro TTS**
2. Genera subtítulos precisos con **Whisper** (modelo multilingüe)
3. Busca videos de fondo relevantes en **Pexels**
4. Compone todos los elementos con **Remotion**
5. Renderiza el video con subtítulos sincronizados

---

## Voces disponibles en español

| ID | Género | Descripción |
|---|---|---|
| `em_alex` | Masculino | Voz masculina en español (por defecto) |
| `ef_dora` | Femenino | Voz femenina en español |
| `em_santa` | Masculino | Voz masculina alternativa en español |

---

## Requisitos

- Conexión a internet
- [API key gratuita de Pexels](https://www.pexels.com/api/)
- ≥ 3 GB de RAM libre (se recomiendan 4 GB)
- ≥ 2 vCPU
- ≥ 5 GB de espacio en disco

---

## Conceptos

### Escena

Cada video se compone de varias **escenas**. Cada escena tiene:

1. **Texto**: La narración que el TTS leerá y de la que se generarán los subtítulos.
2. **Términos de búsqueda**: Las palabras clave para buscar videos en Pexels. Si no se encuentran resultados, se usan términos comodín (`nature`, `globe`, `space`, `ocean`).

---

## Cómo ejecutarlo

### 🐳 Docker (recomendado)

Te recomendamos crear un archivo `.env` en la raíz de tu proyecto para gestionar de forma segura tu configuración local.

**Ejemplo de archivo `.env`**
```env
PORT=3123
PEXELS_API_KEY=tu_api_key_aqui
WHISPER_MODEL=medium
LOG_LEVEL=debug
```

#### Ejecución rápida con Docker Run

Si prefieres correr el servidor usando tu imagen ya compilada en Docker Hub y leyendo tus envs locales:

```bash
docker run -d --name short-video-maker \
  -p 3123:3123 \
  --env-file .env \
  aldomrodriguez/short-video-maker_spanish:latest
```

### 🐙 Docker Compose

Si prefieres usar la orquestación, este es el formato recomendado para levantar directamente tu imagen compilada de Docker Hub usando el archivo `.env`:

```yaml
version: "3"

services:
  short-video-maker:
    image: aldomrodriguez/short-video-maker_spanish:latest
    container_name: short-video-maker
    env_file:
      - .env
    ports:
      - "3123:3123"
    volumes:
      - ./videos:/app/data/videos  # expone los videos generados
```

> **Si usas [Self-hosted AI starter kit de n8n](https://github.com/n8n-io/self-hosted-ai-starter-kit):** añade `networks: ['demo']` al servicio para poder accederlo desde n8n con `http://short-video-maker:3123`.

### 📦 Ejecución local con pnpm

Además de Docker, puedes ejecutarlo en local.

#### Plataformas compatibles

- **Ubuntu ≥ 22.04** — paquetes necesarios:
  ```bash
  sudo apt install -y git wget cmake ffmpeg curl make libsdl2-dev espeak-ng \
    libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 \
    libxkbcommon-dev libxfixes3 libxcomposite1 libxdamage1 \
    libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2
  ```
- **macOS** — requiere:
  ```bash
  brew install ffmpeg espeak-ng
  ```
  Node.js ≥ 22 (recomendado con [nvm](https://github.com/nvm-sh/nvm))

> ⚠️ **Windows no está soportado** (la instalación de whisper.cpp falla con frecuencia).

#### Instalación y ejecución

```bash
pnpm install
pnpm dev
```

---

## Web UI

El servidor incluye una interfaz web accesible desde el navegador en:

**http://localhost:3123**

---

## Variables de entorno

### 🟢 Configuración

| Variable | Descripción | Por defecto |
|---|---|---|
| `PEXELS_API_KEY` | Tu [API key gratuita de Pexels](https://www.pexels.com/api/) | — |
| `LOG_LEVEL` | Nivel de log (pino) | `info` |
| `WHISPER_VERBOSE` | Si mostrar la salida de whisper.cpp en stdout | `false` |
| `PORT` | Puerto en el que escucha el servidor | `3123` |

### ⚙️ Configuración del sistema

| Variable | Descripción | Por defecto |
|---|---|---|
| `KOKORO_MODEL_PRECISION` | Precisión del modelo Kokoro: `fp32`, `fp16`, `q8`, `q4`, `q4f16` | Según la imagen Docker |
| `CONCURRENCY` | Tabs de Chrome en paralelo durante el render (Remotion). Reducir si hay errores de memoria | Según la imagen Docker |
| `VIDEO_CACHE_SIZE_IN_BYTES` | Caché de frames para Remotion. Reducir si hay errores de memoria | Según la imagen Docker |

### ⚠️ Zona de peligro

| Variable | Descripción | Por defecto |
|---|---|---|
| `WHISPER_MODEL` | Modelo de whisper.cpp: `tiny`, `base`, `small`, `medium`, `large-v1/v2/v3`, `large-v3-turbo` (sin `.en` para multilingüe) | `medium` |
| `DATA_DIR_PATH` | Directorio de datos del proyecto | `~/.ai-agents-az-video-generator` (npm) / `/app/data` (Docker) |
| `DOCKER` | Si el proyecto corre en un contenedor Docker | `true` en Docker |
| `DEV` | Modo desarrollo | `false` |

---

## Opciones de configuración

| Opción | Descripción | Por defecto |
|---|---|---|
| `paddingBack` | Tiempo extra al final del video tras el narrado (en ms) | `0` |
| `music` | Estado de ánimo de la música de fondo. Ver `GET /api/music-tags` | aleatorio |
| `captionPosition` | Posición de los subtítulos: `top`, `center`, `bottom` | `bottom` |
| `captionBackgroundColor` | Color de fondo del subtítulo activo | `blue` |
| `voice` | Voz Kokoro a usar | `em_alex` |
| `orientation` | Orientación del video: `portrait` o `landscape` | `portrait` |
| `musicVolume` | Volumen de la música: `low`, `medium`, `high`, `muted` | `high` |

---

## API REST

### GET `/health`

```bash
curl localhost:3123/health
# {"status":"ok"}
```

### POST `/api/short-video`

```bash
curl -X POST localhost:3123/api/short-video \
  -H 'Content-Type: application/json' \
  -d '{
    "scenes": [
      {
        "text": "El sol sale cada mañana para recordarnos que siempre hay una nueva oportunidad.",
        "searchTerms": ["amanecer", "sol"]
      }
    ],
    "config": {
      "paddingBack": 1500,
      "music": "chill",
      "voice": "em_alex"
    }
  }'
# {"videoId":"cma9sjly700020jo25vwzfnv9"}
```

### GET `/api/short-video/{id}/status`

```bash
curl localhost:3123/api/short-video/{id}/status
# {"status":"ready"}
```

### GET `/api/short-video/{id}`

Devuelve los datos binarios del video generado.

### GET `/api/short-videos`

Lista todos los videos generados.

### DELETE `/api/short-video/{id}`

Elimina un video.

### GET `/api/voices`

```bash
curl localhost:3123/api/voices
# ["ef_dora","em_alex","em_santa"]
```

### GET `/api/music-tags`

```bash
curl localhost:3123/api/music-tags
# ["sad","melancholic","happy","euphoric/high","excited","chill","uneasy","angry","dark","hopeful","contemplative","funny/quirky"]
```

---

## Servidor MCP

### URLs del servidor

- `/mcp/sse`
- `/mcp/messages`

### Herramientas disponibles

| Herramienta | Descripción |
|---|---|
| `create-short-video` | Crea un video corto. El LLM determina la configuración óptima. |
| `get-video-status` | Consulta el estado de un video en proceso. |

---

## n8n

La URL del servidor depende de cómo ejecutes n8n y el servidor:

| | n8n local (`n8n start`) | n8n local en Docker | n8n en la nube |
|---|---|---|---|
| **Servidor en Docker, local** | `http://localhost:3123` | `http://host.docker.internal:3123` o nombre del servicio | No funciona — desplegar el servidor en la nube |
| **Servidor con pnpm, local** | `http://localhost:3123` | `http://host.docker.internal:3123` | No funciona — desplegar el servidor en la nube |
| **Servidor en la nube** | `http://{TU_IP}:3123` | `http://{TU_IP}:3123` | `http://{TU_IP}:3123` |

---

## Solución de problemas

### Docker

- El servidor necesita al menos **3 GB de RAM libre**. Asegúrate de asignar suficiente memoria a Docker.
- En Windows con WSL2: configura los límites de recursos en [wsl config](https://learn.microsoft.com/en-us/windows/wsl/wsl-config#configure-global-options-with-wslconfig) o en Docker Desktop.

### Local (pnpm)

- Asegúrate de tener instalado `espeak-ng` (necesario para el TTS en español).
- Comprueba que todos los paquetes del sistema listados en [plataformas compatibles](#plataformas-compatibles) estén instalados.

---

## Despliegue en la nube

Consejos generales para VPS:

- Usa **Ubuntu ≥ 22.04**
- Mínimo: **4 GB RAM**, **2 vCPU**, **5 GB de almacenamiento**
- Usa [pm2](https://pm2.keymetrics.io/) para gestionar el proceso del servidor
- Guarda las variables de entorno en `.bashrc` o `.env`

---

## FAQ

**¿Puedo usar otros idiomas además del español?**
Las voces del TTS de este fork son específicamente voces en español. El modelo Whisper `medium` sí puede transcribir en múltiples idiomas.

**¿Puedo añadir mis propios videos como fondo?**
No, por ahora los videos de fondo se obtienen exclusivamente de Pexels.

**¿Puedo pasar imágenes para generar el video?**
No.

**¿Cuánta GPU se usa?**
Poca. Solo whisper.cpp puede acelerarse con GPU. Remotion es intensivo en CPU, y Kokoro corre en CPU.

**¿Es necesaria la GPU?**
No. El proyecto funciona completamente en CPU.

**¿Dónde está la UI?**
Disponible en `http://localhost:3123` cuando el servidor está en marcha.

---

## Limitaciones

- Los videos de fondo se obtienen de Pexels (requiere API key gratuita)
- Windows no está soportado oficialmente

---

## Dependencias

| Dependencia | Versión | Licencia | Propósito |
|---|---|---|---|
| [Remotion](https://remotion.dev/) | ^4.0.286 | [Remotion License](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) | Composición y renderizado de video |
| [Whisper.cpp](https://github.com/ggml-org/whisper.cpp) | v1.7.1 | MIT | Speech-to-text para subtítulos |
| [FFmpeg](https://ffmpeg.org/) | ^2.1.3 | LGPL/GPL | Manipulación de audio/video |
| [Kokoro.js](https://www.npmjs.com/package/kokoro-js) | ^1.2.0 | MIT | Text-to-speech en español |
| [Pexels API](https://www.pexels.com/api/) | N/A | [Pexels Terms](https://www.pexels.com/license/) | Videos de fondo |
| [espeak-ng](https://github.com/espeak-ng/espeak-ng) | sistema | GPL | Fonética para TTS en español |

---

## Licencia

Este proyecto está licenciado bajo la [Licencia MIT](LICENSE).

---

## Créditos

Fork basado en el trabajo original de [gyoridavid/short-video-maker](https://github.com/gyoridavid/short-video-maker) — canal de YouTube [AI Agents A-Z](https://www.youtube.com/channel/UCloXqLhp_KGhHBe1kwaL2Tg).

- ❤️ [Remotion](https://remotion.dev/) — generación programática de video
- ❤️ [Whisper.cpp](https://github.com/ggml-org/whisper.cpp) — speech-to-text
- ❤️ [Pexels](https://www.pexels.com/) — contenido de video de fondo
- ❤️ [FFmpeg](https://ffmpeg.org/) — procesamiento de audio/video
- ❤️ [Kokoro](https://github.com/hexgrad/kokoro) — text-to-speech
- ❤️ [espeak-ng](https://github.com/espeak-ng/espeak-ng) — fonética multilingüe
