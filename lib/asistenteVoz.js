import { GoogleGenerativeAI } from '@google/generative-ai';

export class AsistenteVoz {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_KEY);
    this.estaEscuchando = false;
    this.reconocimientoVoz = null;
    this.timeoutEscucha = null;
  }

  async iniciarEscucha(callback) {
    if (this.estaEscuchando) return;

    try {
      this.estaEscuchando = true;
      console.log("🔴 Escuchando...");

      const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.reconocimientoVoz = new Reconocimiento();
      this.reconocimientoVoz.lang = 'es-ES';
      this.reconocimientoVoz.interimResults = false;
      this.reconocimientoVoz.continuous = true; // ← ¡Nuevo! Permite escucha continua

      // Configura timeout para errores de silencio
      this.timeoutEscucha = setTimeout(() => {
        this.detenerEscucha();
        callback("Por favor, habla claro y cerca del micrófono.");
      }, 7000); // 7 segundos para hablar

      this.reconocimientoVoz.onresult = (evento) => {
        clearTimeout(this.timeoutEscucha); // Cancela el timeout al detectar voz
        const texto = evento.results[evento.results.length - 1][0].transcript;
        console.log("Usuario dijo:", texto);
        callback(texto);
      };

      this.reconocimientoVoz.onerror = (evento) => {
        clearTimeout(this.timeoutEscucha);
        console.error("Error técnico:", evento.error);
        this.detenerEscucha();
        if (evento.error !== 'no-speech') { // Filtramos errores de silencio
          callback("Error técnico. Recarga la página e intenta nuevamente.");
        }
      };

      this.reconocimientoVoz.start();

    } catch (error) {
      console.error("Error al iniciar:", error);
      this.estaEscuchando = false;
      callback("No se pudo iniciar el micrófono. Verifica los permisos.");
    }
  }

  detenerEscucha() {
    if (this.reconocimientoVoz) {
      this.reconocimientoVoz.stop();
      clearTimeout(this.timeoutEscucha);
    }
    this.estaEscuchando = false;
    console.log("🟢 Escucha detenida");
  }

  async obtenerRespuestaGemini(pregunta, productos) {
    if (!productos || productos.length === 0) {
      return "No hay productos disponibles para comparar.";
    }
    
    try {
      const modelo = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const resultado = await modelo.generateContent(
        `Basado en estos productos: ${JSON.stringify(productos)}\n\nPregunta: ${pregunta}`
      );
      return resultado.response.text();
    } catch (error) {
      console.error("Error en Gemini:", error);
      return "Lo siento, hubo un error al procesar tu pregunta.";
    }
  }
}