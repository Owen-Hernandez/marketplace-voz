import { useState, useEffect } from 'react';
import { supabase, buscarProductos } from '../lib/supabase';
import { simpleGeminiCall } from '../lib/gemini';

export default function Home() {
  const [productos, setProductos] = useState([]);
  const [productosOriginales, setProductosOriginales] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [respuestaGemini, setRespuestaGemini] = useState(''); // Nuevo estado
  const [cargando, setCargando] = useState(false);

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

  // Buscar por voz
  const iniciarVoz = async () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'es-ES';
    
    recognition.onresult = async (event) => {
      const texto = event.results[0][0].transcript;
      setTranscript(texto);
      setCargando(true);
      
      // Llamada a Gemini
      const respuesta = await simpleGeminiCall(texto);
      setRespuestaGemini(respuesta); // Guardar respuesta
      console.log('Respuesta Gemini:', respuesta);
      
      // Filtrado original
      const resultados = await buscarProductos(texto);
      setProductos(resultados);
      setCargando(false);
    };
    recognition.start();
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setProductos(productosOriginales);
    setTranscript('');
    setRespuestaGemini(''); // Limpiar también la respuesta
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
            <div key={producto.id} className="producto-card">
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