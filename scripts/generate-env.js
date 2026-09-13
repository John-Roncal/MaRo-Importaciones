// Se ejecuta ANTES de "ng build" durante el deploy (o localmente si
// quieres probar un build de producción). Lee las variables de entorno
// que configures en Render y genera environment.prod.ts con esos valores.
// Este archivo generado NUNCA se sube a git (ver .gitignore).

const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠ SUPABASE_URL o SUPABASE_ANON_KEY no están definidas. Revisa las variables de entorno en Render.');
}

const contenido = `export const environment = {
  production: true,
  supabaseUrl: '${supabaseUrl}',
  supabaseKey: '${supabaseKey}'
};
`;

const destino = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
fs.mkdirSync(path.dirname(destino), { recursive: true }); // por si la carpeta no existe en el repo clonado
fs.writeFileSync(destino, contenido);
console.log('✅ environment.prod.ts generado a partir de variables de entorno.');