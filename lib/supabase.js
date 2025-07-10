import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Función para búsqueda por voz
export async function buscarProductos(texto) {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .or(`nombre.ilike.%${texto}%,descripcion.ilike.%${texto}%`);

  if (error) {
    console.error('Error buscando productos:', error);
    return [];
  }

  return data;
}