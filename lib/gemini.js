import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuración inicial (sin cambios)
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    maxOutputTokens: 120,
    temperature: 0.3,
    topP: 0.95
  },
  safetySettings: [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" }
  ]
});

// Sistema de caché (nuevo)
const memoryCache = new Map();
const CACHE_PREFIX = 'gemini-';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

function generateCacheKey(prompt, productos = []) {
  const productosKey = productos.map(p => p.id).sort().join('-');
  return `${CACHE_PREFIX}${prompt}-${productosKey}`;
}

// Helper para categorías (sin cambios)
function obtenerCategoria(nombre) {
  if (/iphone|macbook/i.test(nombre)) return "Tecnología Apple";
  if (/playstation|xbox|nintendo/i.test(nombre)) return "Gaming";
  if (/nike|adidas|levi's|zara/i.test(nombre)) return "Moda";
  return "Electrónica";
}

export async function simpleGeminiCall(prompt, productos = []) {
  const cacheKey = generateCacheKey(prompt, productos);
  
  // 1. Verificar caché antes de llamar a la API
  if (memoryCache.has(cacheKey)) {
    console.log('[Caché] Respuesta recuperada');
    return memoryCache.get(cacheKey);
  }

  try {
    // Lógica existente (sin modificaciones)
    const contexto = productos.map(producto => 
      `≡ ${producto.nombre.toUpperCase()} ≡\n` +
      `• Descripción: ${producto.descripcion}\n` +
      `• Precio: $${producto.precio.toFixed(2)}\n` +
      `• Categoría: ${obtenerCategoria(producto.nombre)}`
    ).join('\n\n');

    const instruccion = `Eres un asistente de ventas experto. Basado EXCLUSIVAMENTE en:
    
=== INVENTARIO ACTUAL ===
${contexto}

=== REGLAS ===
1. Prioriza productos mencionados en la consulta
2. Destaca: [Nombre exacto] + [1-2 características] + [Precio]
3. Si no hay coincidencia exacta, sugiere 3 alternativas relevantes
4. Formato: "[NOMBRE]: [CARACTERÍSTICAS]. Precio: [PRECIO]"

=== CONSULTA ===
"${prompt}"`;

    const result = await model.generateContent(instruccion);
    let respuesta = result.response.text()
      .replace(/\*\*/g, '')
      .replace(/^\s*\-/, '')
      .trim();

    // 2. Guardar en caché después de obtener respuesta
    memoryCache.set(cacheKey, respuesta);
    if (typeof window !== 'undefined') {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: respuesta,
        expires: Date.now() + CACHE_TTL
      }));
    }

    return respuesta;
      
  } catch (error) {
    console.error("Error en Gemini:", error.message);
    const sugerencias = productos.slice(0, 3).map(p => p.nombre).join(', ');
    return `Te recomiendo revisar: ${sugerencias}`;
  }
}

// Cargar caché al iniciar (opcional - añadir en _app.js)
export function loadGeminiCache() {
  if (typeof window !== 'undefined') {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const { expires, data } = JSON.parse(localStorage.getItem(key));
          if (Date.now() < expires) {
            memoryCache.set(key, data);
          } else {
            localStorage.removeItem(key);
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      }
    });
  }
}