/**
 * Sistema de Autenticación con Tokens
 * 
 * Genera y valida tokens de acceso para la API
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const TOKENS_FILE = path.resolve(__dirname, '../storage/tokens.json');
const STORAGE_DIR = path.dirname(TOKENS_FILE);

// Asegurar que el directorio existe
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Token por defecto desde .env o generar uno nuevo
const DEFAULT_TOKEN = process.env.API_TOKEN || generarToken();

/**
 * Genera un token aleatorio
 */
function generarToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Cargar tokens válidos desde archivo
 */
function cargarTokens() {
  try {
    if (!fs.existsSync(TOKENS_FILE)) {
      // Crear archivo con token por defecto si no existe
      const tokensIniciales = {
        default: {
          token: DEFAULT_TOKEN,
          creado: new Date().toISOString(),
          activo: true,
          descripcion: 'Token por defecto'
        }
      };
      guardarTokens(tokensIniciales);
      return tokensIniciales;
    }
    const data = fs.readFileSync(TOKENS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error cargando tokens:', error.message);
    return {};
  }
}

/**
 * Guardar tokens
 */
function guardarTokens(tokens) {
  try {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error guardando tokens:', error.message);
  }
}

/**
 * Validar un token
 * 
 * @param {string} token - Token a validar
 * @returns {boolean} - True si el token es válido
 */
function validarToken(token) {
  if (!token) {
    return false;
  }
  
  const tokens = cargarTokens();
  
  // Buscar el token en la lista
  for (const [key, tokenData] of Object.entries(tokens)) {
    if (tokenData.token === token && tokenData.activo) {
      return true;
    }
  }
  
  return false;
}

/**
 * Agregar un nuevo token
 * 
 * @param {string} descripcion - Descripción del token
 * @returns {string} - Nuevo token generado
 */
function crearToken(descripcion = 'Token generado') {
  const tokens = cargarTokens();
  const nuevoToken = generarToken();
  const key = `token_${Date.now()}`;
  
  tokens[key] = {
    token: nuevoToken,
    creado: new Date().toISOString(),
    activo: true,
    descripcion
  };
  
  guardarTokens(tokens);
  return nuevoToken;
}

/**
 * Middleware de autenticación para Express
 */
function middlewareAuth(req, res, next) {
  // Obtener token del header Authorization o query parameter
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.headers['x-api-token'] || 
                req.query.token;
  
  if (!token) {
    return res.status(401).json({
      error: 'No autorizado',
      mensaje: 'Token de autenticación requerido',
      ayuda: 'Incluye el token en el header: Authorization: Bearer <token> o x-api-token: <token>'
    });
  }
  
  if (!validarToken(token)) {
    return res.status(403).json({
      error: 'Token inválido',
      mensaje: 'El token proporcionado no es válido o está inactivo'
    });
  }
  
  next();
}

/**
 * Obtener token por defecto (útil para la primera configuración)
 */
function obtenerTokenPorDefecto() {
  const tokens = cargarTokens();
  for (const [key, tokenData] of Object.entries(tokens)) {
    if (tokenData.descripcion === 'Token por defecto' || key === 'default') {
      return tokenData.token;
    }
  }
  return DEFAULT_TOKEN;
}

module.exports = {
  validarToken,
  crearToken,
  middlewareAuth,
  obtenerTokenPorDefecto,
  generarToken
};