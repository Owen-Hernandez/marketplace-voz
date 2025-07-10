import { useState, useEffect } from 'react';
import { supabase, buscarProductos } from '../lib/supabase';
import { simpleGeminiCall } from '../lib/gemini';

export default function Home() {
  const [productos, setProductos] = useState([]);
  const [productosOriginales, setProductosOriginales] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [respuestaGemini, setRespuestaGemini] = useState('');
  const [cargando, setCargando] = useState(false);
  const [productosRecomendados, setProductosRecomendados] = useState([]);

  // Cargar productos iniciales
  useEffect(() => {
    async function cargarProductos() {
      setCargando(true);
      const { data } = await supabase.from('productos').select('*');
      setProductos(data || []);
      setProductosOriginales(data || []);
      setCargando(false);
    }
    cargarProductos();
  }, []);

  // Buscar por voz (mejorado para recomendaciones)
  const iniciarVoz = async () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'es-ES';
    
    recognition.onresult = async (event) => {
      const texto = event.results[0][0].transcript;
      setTranscript(texto);
      setCargando(true);
      
      // 1. Obtener respuesta contextual de Gemini
      const respuesta = await simpleGeminiCall(texto, productosOriginales);
      setRespuestaGemini(respuesta);

      // 2. Extraer productos mencionados en la respuesta
      const productosFiltrados = productosOriginales.filter(producto => 
        respuesta.toLowerCase().includes(producto.nombre.toLowerCase())
      );
      setProductosRecomendados(productosFiltrados);

      // 3. Mostrar productos recomendados o filtrados por texto
      setProductos(
        productosFiltrados.length > 0 
          ? productosFiltrados 
          : await buscarProductos(texto)
      );
      
      setCargando(false);
    };
    recognition.start();
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setProductos(productosOriginales);
    setProductosRecomendados([]);
    setTranscript('');
    setRespuestaGemini('');
  };

  return (
    <div>
      <h1>Marketplace con Voz</h1>
      
      <div className="contenedor-botones">
        <button 
          onClick={iniciarVoz}
          className="boton-voz"
          disabled={cargando}
        >
          {cargando ? 'Buscando...' : '🎤 Buscar por Voz'}
        </button>

        {transcript && (
          <button 
            onClick={limpiarFiltros}
            className="boton-limpiar"
          >
            ✖ Limpiar filtros
          </button>
        )}
      </div>

      {transcript && (
        <div className="mensaje-voz">
          Buscando: "{transcript}"
        </div>
      )}

      {respuestaGemini && (
        <div className="mensaje-gemini">
          🎤 <strong>Asistente:</strong> {respuestaGemini}
        </div>
      )}

      {cargando && <p>Cargando...</p>}

      <div className="productos-container">
        {productos.length > 0 ? (
          productos.map((producto) => (
            <div 
              key={producto.id} 
              className={`producto-card ${
                productosRecomendados.some(p => p.id === producto.id) ? 'producto-recomendado' : ''
              }`}
            >
              <h3>{producto.nombre}</h3>
              <p>{producto.descripcion}</p>
              <p className="precio">${producto.precio.toFixed(2)}</p>
            </div>
          ))
        ) : (
          !cargando && <p>No se encontraron productos.</p>
        )}
      </div>
    </div>
  );
}