DOCUMENTACION

Marketplace interactivo con asistente de voz AI para búsqueda y recomendación de productos, implementando las tecnologías requeridas: Supabase, Gemini Live y RAG.

Tecnologías Implementadas
Tecnología	Uso	Versión
Lovable	Framework frontend	-
Supabase	Backend/BBDD + Vector Embeddings	v2.0+
Gemini Live	Procesamiento de voz y respuestas AI	v1.5-flash
pgvector	Almacenamiento de embeddings	v0.5+
React	Gestión de estado/interfaz	18.2+

Estructura de Archivos

MARKETPLACE-VOZ/
│
├── lib/
│   ├── gemini.js               # Conexión con Gemini API
│   ├── supabase.js             # Configuración Supabase
│   └── asistenteVoz.js         # Lógica de voz
│
├── pages/
│   ├── _app.js                 # Inicialización de la app
│   └── index.js                # Página principal (UI)
│
├── styles/
│   └── globals.css             # Todos los estilos
│
├── .env.local                  # Variables de entorno (TODAS LAS KEYS)
└── README.md                   # Este archivo

Instalación
npm install @google/generative-ai @supabase/supabase-js

Sistema RAG (Retrieval-Augmented Generation)
Qué hace:
Combina búsqueda semántica con generación de respuestas contextuales.

Cómo funciona:

Generación de Embeddings:

Convierte descripciones de productos en vectores numéricos (usando text-embedding-3-small)

Almacena en Supabase

Gemini recibe:
"Basado en estos productos: [JSON de productos relevantes]  
 Responde la pregunta: '¿Qué cámara recomiendan para viajes?'"