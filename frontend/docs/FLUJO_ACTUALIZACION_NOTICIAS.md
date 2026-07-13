# Flujo de actualización de noticias

Este documento explica el flujo actual de Codito Zeitung: desde la publicación de una noticia por una institución hasta su visualización en las cards del frontend en producción.

## Resumen del flujo

```text
SRF News ───────┐
ETH Zürich ─────┤
NZZ ────────────┼─> Fuentes RSS ─> Actualizador del VPS ─> Selección y clasificación
WOZ ────────────┤                                          │
WWF Schweiz ────┘                                          │
                                                           v
                                               generatedArticles.ts
                                                           │
                                                           v
                                                 Build del frontend
                                                           │
                                                           v
                                                   Reinicio con PM2
                                                           │
                                                           v
                                            Cards y páginas de noticias
```

## 1. Las instituciones publican las noticias

El sistema consulta las fuentes RSS públicas configuradas para:

- SRF News
- ETH Zürich
- NZZ
- WOZ
- WWF Schweiz

Las cuatro fuentes periodísticas se consultan mediante RSS. WWF Schweiz no ofrece un RSS público visible, por lo que el actualizador extrae sus comunicados desde la página oficial de prensa. De cada publicación se intenta obtener:

- Título
- Enlace original
- Fecha de publicación
- Descripción o resumen
- Institución de origen

La configuración de estas fuentes se encuentra en:

```text
deploy/news-updater/codito_zeitung_web_news.py
```

Este archivo está en la raíz general del proyecto, fuera de la carpeta `frontend`.

## 2. Los temporizadores del VPS inician el proceso

El VPS utiliza temporizadores de systemd.

### Actualización regular

El temporizador regular se comprueba todos los días a las **09:15**, usando la zona horaria `Europe/Zurich`.

El actualizador solo continúa si han transcurrido al menos **71 horas** desde la última actualización regular exitosa. Por eso funciona aproximadamente cada tres días, aunque la hora exacta puede desplazarse hasta la siguiente comprobación diaria.

Los domingos la actualización regular se omite para dar prioridad a la selección semanal.

Archivo de configuración:

```text
deploy/news-updater/codito-zeitung-web-news.timer
```

### Actualización semanal

Los domingos a las **10:15** se ejecuta una selección semanal. Deben haber transcurrido al menos seis días desde la última ejecución semanal exitosa.

Archivo de configuración:

```text
deploy/news-updater/codito-zeitung-web-news-weekly.timer
```

Ambos temporizadores ejecutan el servicio:

```text
deploy/news-updater/codito-zeitung-web-news@.service
```

## 3. El actualizador obtiene y valida la información

Cuando comienza una ejecución, el script del VPS:

1. Descarga las entradas de las cuatro fuentes RSS.
2. Normaliza títulos, textos, fechas y enlaces.
3. Elimina parámetros de seguimiento de las URLs.
4. Descarta duplicados por URL o por título normalizado.
5. Conserva publicaciones recientes.
6. Registra los errores individuales de cada fuente sin descartar automáticamente las demás.

Cada actualización trabaja con las noticias publicadas durante los últimos siete días. Esto permite mantener un catálogo suficientemente amplio entre ejecuciones sin conservar contenido demasiado antiguo.

## 4. Las noticias se clasifican y seleccionan

El actualizador clasifica cada noticia en una de las categorías del frontend:

- Política, votaciones y derecho
- Economía, trabajo y empresas
- Ciencia, tecnología e inteligencia artificial
- Medioambiente, clima y biodiversidad
- Salud, educación y sociedad
- Transporte, SBB y Zürich
- Cultura
- Deporte

La clasificación se realiza comparando el título y el resumen con palabras clave. Después se asigna una puntuación que favorece asuntos relevantes para Suiza y reduce la prioridad de contenido de poco valor informativo.

Finalmente, el sistema intenta crear una selección equilibrada entre instituciones y categorías, con un máximo actual de **30 noticias**.

## 5. Se prepara el contenido de cada artículo

El resumen incluido en el RSS se utiliza como contenido base.

Cuando es posible, el sistema también intenta:

1. Comprobar las reglas de `robots.txt` del sitio de origen.
2. Abrir la página pública del artículo.
3. Extraer párrafos útiles, excluyendo navegación, publicidad y texto repetitivo.
4. Generar un resumen en alemán mediante el modelo local Ollama instalado en el VPS.

El sistema respeta las restricciones de acceso. Si la página está bloqueada, detrás de un paywall, no permite la extracción o el resumen generado no supera las validaciones, se conserva el resumen original del RSS. La noticia puede publicarse igualmente sin interrumpir toda la actualización.

Para controlar el tiempo y los recursos, actualmente solo se intenta generar un resumen ampliado nuevo por ejecución. Los resultados se guardan en una caché del actualizador.

## 6. La información se escribe en el frontend

La selección final se transforma al tipo `Article` utilizado por React. Cada noticia incluye datos como:

```ts
{
  id: 123456,
  source: "SRF News",
  category: "Kultur",
  title: "Título de la noticia",
  excerpt: "Resumen breve",
  content: ["Párrafo del artículo"],
  url: "https://fuente-original.example/noticia",
  time: "13.07.2026",
  readTime: "2 Min.",
  imagePosition: "50%"
}
```

El actualizador escribe automáticamente el resultado en:

```text
frontend/src/Data/generatedArticles.ts
```

La escritura utiliza primero un archivo temporal y después lo sustituye, evitando dejar un archivo incompleto si el proceso se interrumpe durante esa operación.

Este archivo es generado automáticamente y no debería editarse manualmente.

## 7. React conecta los datos con las cards

El recorrido dentro del frontend es el siguiente:

1. `src/Data/news.ts` exporta las noticias de `generatedArticles.ts`.
2. `src/Pages/HomePage.tsx` importa la colección `articles`.
3. La página aplica el filtro de categoría y la búsqueda del usuario sobre el título, el resumen, la fuente y la categoría.
4. Se muestran nueve resultados inicialmente y el usuario puede cargar otros nueve hasta completar la selección disponible.
5. Cada elemento visible se entrega al componente `NewsCard`.
6. `src/Components/NewsCard.tsx` muestra la fuente, fecha, título, resumen, categoría y tiempo de lectura.
7. El enlace **Weiterlesen** abre la ruta de detalle de la noticia.
8. `src/Pages/NewsDetailsPage.tsx` busca el mismo artículo y muestra su contenido completo disponible, su fuente original y noticias relacionadas.

Las imágenes de las cards se eligen según la categoría, no desde la imagen original de cada institución. La relación entre categoría e imagen está en:

```text
frontend/src/Data/categoryImages.ts
```

## 8. El VPS construye y publica la nueva versión

Después de actualizar los datos, el script ejecuta:

```bash
npm run build
```

Este comando valida TypeScript y genera la versión de producción con Vite dentro de `frontend/dist`.

Si el build termina correctamente, el actualizador ejecuta:

```bash
pm2 restart coditozeitung-frontend
pm2 save
```

PM2 reinicia la aplicación para servir la versión recién construida. Desde ese momento, las nuevas noticias se visualizan en las cards del sitio de producción.

## 9. Protecciones ante fallos

El flujo contiene varias medidas para evitar dejar la web sin noticias:

- Si se pueden consultar menos de dos fuentes, no se despliega la actualización.
- Si se seleccionan menos de tres noticias confiables, se conserva la información que ya estaba publicada.
- Si falla la extracción o el resumen ampliado, se utiliza el resumen RSS.
- Si falla el build, PM2 no se reinicia y la aplicación que estaba funcionando continúa activa.
- El momento de la última actualización exitosa se guarda solamente después de completar la generación, el build y el reinicio.
- Los eventos y errores quedan registrados en el log del actualizador del VPS.

## 10. Relación con Git y GitHub

La actualización automática de noticias ocurre directamente dentro del VPS. El flujo actual **no ejecuta** `git commit` ni `git push`.

Esto significa:

- La web de producción puede mostrar noticias nuevas aunque GitHub no contenga esas noticias.
- Hacer `git pull` en otra computadora no descarga las noticias generadas en el VPS.
- Después de una actualización, `generatedArticles.ts` puede aparecer como un cambio local dentro del repositorio del VPS.
- Un pull o despliegue que también modifique ese archivo puede producir un conflicto o reemplazar temporalmente sus datos.

Por ahora esto es aceptable porque el frontend se actualiza y publica directamente en el VPS. Conviene no editar `generatedArticles.ts` desde GitHub y revisar el estado del repositorio antes de hacer un pull en producción.

## 11. Comandos útiles de comprobación

Ver el estado de los temporizadores:

```bash
systemctl status codito-zeitung-web-news.timer
systemctl status codito-zeitung-web-news-weekly.timer
```

Ver las próximas ejecuciones:

```bash
systemctl list-timers --all codito-zeitung-web-news.timer codito-zeitung-web-news-weekly.timer
```

Comprobar el proceso del frontend:

```bash
pm2 status coditozeitung-frontend
```

Comprobar que el frontend puede construirse:

```bash
cd /var/www/codito-zeitung/frontend
npm run build
```

Revisar si el generador produjo cambios locales:

```bash
cd /var/www/codito-zeitung
git status --short
```

## 12. Evolución futura con backend y base de datos

Cuando se incorpore el backend, el flujo podrá evolucionar a:

```text
Fuentes RSS -> Backend del VPS -> Base de datos -> API -> Frontend React
```

En ese escenario:

- Las noticias dejarán de formar parte del código fuente.
- No será necesario reconstruir y reiniciar el frontend por cada actualización.
- El frontend solicitará las noticias actuales a una API.
- GitHub almacenará el código y la base de datos almacenará el contenido.
- Las actualizaciones podrán reflejarse en el navegador mediante una nueva consulta o una estrategia de caché.

Hasta que exista ese backend, `generatedArticles.ts` actúa como la capa de datos del frontend y el VPS se encarga de regenerarlo y publicar el nuevo build.
