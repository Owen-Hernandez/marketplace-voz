import { useState, useEffect } from 'react';
import { supabase, buscarProductos } from '../lib/supabase';
import { simpleGeminiCall } from '../lib/gemini';
import { AsistenteVoz } from '../lib/asistenteVoz';
  
// Instancia global del asistente
const asistente = new AsistenteVoz();

export default function Home() {
  const [productos, setProductos] = useState([]);
  const [productosOriginales, setProductosOriginales] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [respuestaGemini, setRespuestaGemini] = useState('');
  const [cargando, setCargando] = useState(false);
  const [productosRecomendados, setProductosRecomendados] = useState([]);

  // Cargar productos
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
    setCargando(true);
    
    asistente.iniciarEscucha(async (texto) => {
      setTranscript(texto);
      
      // 1. lógica existente de Gemini
      const respuesta = await simpleGeminiCall(texto, productosOriginales);
      setRespuestaGemini(respuesta);

      // 2. Filtrado de productos
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
    });
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    asistente.detenerEscucha();
    setProductos(productosOriginales);
    setProductosRecomendados([]);
    setTranscript('');
    setRespuestaGemini('');
  };

  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      asistente.detenerEscucha();
    };
  }, []);

  return (
    <div>
      <h1>GeminiAI Shop</h1>
      
      <div className="contenedor-botones">
        <button 
          onClick={iniciarVoz}
          className="boton-voz"
          disabled={cargando}
        >
          {cargando ? 'Escuchando... 🎤' : '🎤 Buscar por Voz'}
        </button>

        {(transcript || respuestaGemini) && (
          <button 
            onClick={limpiarFiltros}
            className="boton-limpiar"
          >
            ✖ Limpiar
          </button>
        )}
      </div>

      {transcript && (
        <div className="mensaje-voz">
          <strong>Tú:</strong> {transcript}
        </div>
      )}

      {respuestaGemini && (
        <div className="mensaje-gemini">
          <strong>Asistente:</strong> {respuestaGemini}
        </div>
      )}

      <div className="productos-container">
        {productos.length > 0 ? (
          productos.map((producto) => (
            <div 
              key={producto.id} 
              className={`producto-card ${
                productosRecomendados.some(p => p.id === producto.id) 
                  ? 'producto-recomendado' 
                  : ''
              }`}
            >
              <h3>{producto.nombre}</h3>
              <p>{producto.descripcion}</p>
              <p className="precio">${producto.precio.toFixed(2)}</p>
              {productosRecomendados.some(p => p.id === producto.id) && (
                <span className="badge-recomendado">⭐ Recomendado</span>
              )}
            </div>
          ))
        ) : (
          !cargando && <p>No se encontraron productos.</p>
        )}
      </div>

      {cargando && (
        <div className="cargando">
          <div className="spinner"></div>
          <p>Procesando tu solicitud...</p>
        </div>
      )}
    </div>
  );
}