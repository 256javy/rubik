# Rubik: aprende pieza a pieza

Tutor espacial de un cubo 3×3, construido con React, TypeScript, Vite, Three.js y React Three Fiber. El cubo lógico es la fuente de verdad: el renderizado nunca determina la posición o la orientación de las piezas.

## Desarrollo

Requiere Node.js 24.x y npm.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

## Desplegar en Vercel

La [documentación oficial de Vercel para Vite](https://vercel.com/docs/frameworks/frontend/vite) describe el despliegue de este tipo de aplicación. Importa este repositorio en Vercel y selecciona el preset **Vite**. La configuración está incluida en `vercel.json`:

- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Node.js: 24.x
- No requiere variables de entorno, servidor ni base de datos.

También puedes ejecutar `npx vercel` desde este directorio para crear un despliegue de prueba y `npx vercel --prod` para publicar, después de vincularlo a tu cuenta y proyecto. Este repositorio no incluye credenciales ni está vinculado a un proyecto de Vercel.

Los movimientos, la búsqueda y el estado se ejecutan en el navegador. El progreso se guarda automáticamente en localStorage del mismo navegador y origen (la dirección del sitio). Al recargar se recuperan el estado, la etapa, el historial, el recorrido pendiente, la referencia de notación y las preferencias. La reproducción se reanuda pausada desde el último giro confirmado; una mezcla se guarda al finalizar. Si el almacenamiento falla, se muestra un aviso y se permite continuar. Los datos inválidos o de una versión incompatible se ignoran. Se necesita WebGL. Las fuentes se sirven con la aplicación, sin peticiones a Google Fonts. Las herramientas de desarrollo se eliminan del build de producción.

## Qué está implementado

- 26 piezas físicas con identidad permanente y 54 pegatinas, posición y orientación enteras, identidad y estado de origen.
- Los 18 giros de notación estándar; mezclas válidas aleatorias y reproducibles. Al reproducir, los giros dobles se expanden en dos cuartos de vuelta (R2 → R + R), con una breve pausa y un estado intermedio accesible en el historial. La misma regla se aplica a mezclas, recorridos y giros manuales.
- Animaciones de capas completas, cubos grises translúcidos, objetivo, piezas protegidas, centros relacionados y destino.
- Referencia inicial: blanco en U, amarillo en D, rojo en F, naranja en B, azul en R y verde en L. Orbitar la cámara no cambia las letras. «Establecer frente y arriba» permite elegir explícitamente otra de las 24 orientaciones válidas a partir de los centros, previsualizar R y alinear la cámara. Los giros manuales y los algoritmos escritos se traducen a los giros físicos del modelo; las guías calculadas se muestran en la notación elegida, conservando exactamente su recorrido físico y los objetivos de etapa.
- Ejes opcionales con etiquetas U/D/F/B/R/L y flechas de giro horario. Las dos cámaras observan los mismos ejes.
- Práctica pública de algoritmos con la orientación establecida: introduzca una secuencia y revise sus pasos o reprodúzcala.
- Una escena y un estado de animación, renderizados por una o dos cámaras opuestas. La vista principal es dominante; en móvil las vistas se apilan.
- Guía dinámica de la cruz, las esquinas blancas y las aristas de segunda capa que busca una secuencia para una pieza y restaura las piezas protegidas al finalizar el objetivo. Puede desplazarlas temporalmente durante el recorrido.
- Historial exclusivo de cada etapa: deshacer, rehacer, reinicio y navegación exacta por instantáneas. Una acción manual después de deshacer descarta la rama futura.
- `GuidedMovePlayer` y `AlgorithmPlayer`, reproducción, pausa, movimientos individuales, inicio, final, timeline y velocidad.
- Giros manuales sin bloquear la exploración. El siguiente recorrido se calcula desde el estado real.
- Siete etapas y sus validadores acumulativos. Al completar una etapa se requiere continuar explícitamente.
- Herramientas de desarrollo: estado resuelto, mezcla reproducible, notación, secuencias, cambio de etapa, selección y protección de piezas e inspección de identidades, posiciones y normales de las pegatinas.

## Alcance del contenido educativo

El encargo pide no inventar el contenido de [Cuby](https://www.youtube.com/watch?v=GyY0OxDk5lI). No se obtuvo una transcripción verificable del vídeo. Los textos de las primeras etapas describen geometría y movimientos calculados; no se presentan como una transcripción ni como algoritmos de Cuby.

`TODO(CUBY_CONTENT)` marca únicamente la correspondencia editorial con el vídeo, todavía no verificada. **Las siete etapas ya tienen una guía funcional.** Las dos primeras calculan recorridos por pieza; la segunda capa utiliza inserciones y las etapas 4–7 utilizan algoritmos de última capa. Cada etapa termina al alcanzar su propio validador y requiere continuar explícitamente. El laboratorio independiente `R U R' U'` queda disponible en las herramientas de desarrollo y no se utiliza para resolver una etapa.

La segunda capa utiliza búsqueda por anchura sobre inserciones y giros D; resuelve únicamente la arista objetivo y restaura las piezas protegidas. Las etapas de última capa utilizan búsqueda sobre algoritmos que preservan los objetivos anteriores al terminar cada secuencia; sus metas distinguen orientación, permutación de aristas, posición de esquinas y orientación final. Las dos primeras etapas utilizan IDA* y tablas de distancias para pares de piezas, dentro de un Web Worker. Está limitada a 12 movimientos y 3 millones de nodos por objetivo para evitar bloquear el navegador. Si una posición supera ese límite, la interfaz informa del límite y permite continuar explorando o utilizar una mezcla de práctica. No utiliza la inversa de la mezcla ni un solucionador completo disfrazado de tutor. Las sugerencias de movimiento describen la cara y el efecto local; las explicaciones específicas de los casos de Cuby siguen pendientes.

## Validación

```sh
npm test
npm run test:e2e
npm run build
npm audit
```

Las pruebas unitarias verifican giros inversos, orientación, permutación, posiciones únicas, mezclas e inversas, una cruz blanca con laterales incorrectos, validadores de etapa, selección de objetivo y protección, historial, ramificación y reinicio. También completan la cruz desde cinco mezclas, una primera capa desde una mezcla reproducible, la segunda capa y las cuatro etapas finales desde múltiples estados legales.

Las pruebas de Playwright recorren mezcla → cruz → pausa de etapa → esquinas → segunda capa → cruz amarilla → aristas amarillas → posición de esquinas → orientación final, con pausas explícitas entre etapas, verifican instantáneas al retroceder y avanzar, el límite del historial, una sola escena en vista doble, navegación rápida y ausencia de desbordamiento horizontal en móvil.

Playwright usa `/usr/bin/google-chrome` de forma predeterminada. Si Chrome está en otra ubicación, configura `CHROME_PATH`. Para usar el Chromium de Playwright, instala `npx playwright install chromium` y adapta `launchOptions` en `playwright.config.ts`.

## Estructura

- `src/cube/`: modelo, giros, mezclas, historial, selectores y validación, sin dependencia de Three.js.
- `src/tutorial/`: objetivos, búsqueda en worker, configuración de etapas, algoritmos y explicaciones.
- `src/rendering/`: escena, cámaras, materiales y atención visual.
- `src/components/`: reproductores reutilizables.
- `src/app/`: aplicación y estilos adaptables.
- `tests/`: pruebas del flujo en navegador.

Las reglas de una pieza están en el modelo y las de una etapa en sus validadores. La animación dibuja el estado anterior y aplica un giro visual temporal; al finalizar se confirma el estado calculado. Los controles bloquean nuevas mutaciones durante un giro. Los saltos de timeline reconstruyen el estado exacto, sin encadenar animaciones intermedias.

La persistencia usa `rubik.tutor.session.v1`. Guarda una instantánea inicial de la etapa, los giros físicos y el cursor, y reconstruye el historial al cargar. No guarda transformaciones del renderizado ni animaciones incompletas. El almacenamiento no se sincroniza entre dispositivos ni entre direcciones como `localhost` y la IP de la red. La posición libre de la cámara no se conserva: al recargar, la vista se alinea con la referencia F/U guardada.
