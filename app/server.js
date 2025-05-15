const http = require("http");
const fs = require("fs");
const path = require("path");
const rutas = require("./routes/router");

// Función para servir archivos estáticos
/**
 * Sirve un archivo estático al cliente.
 *
 * @param {string} filePath - La ruta del archivo que se va a servir.
 * @param {object} res - El objeto de respuesta HTTP.
 *
 * @description
 * Esta función lee un archivo del sistema de archivos y lo envía como respuesta HTTP.
 * Determina el tipo de contenido (Content-Type) basado en la extensión del archivo.
 * Si el archivo no se encuentra, responde con un error 404.
 * Si ocurre un error interno del servidor, responde con un error 500.
 * Depende de los módulos 'fs' y 'path' para leer archivos y manejar rutas.
 */

const servirArchivoEstatico = (filePath, res) => {
    const extname = path.extname(filePath);
    const contentType = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
    }[extname] || "application/octet-stream";

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === "ENOENT") {
                res.writeHead(404, { "Content-Type": "text/html" });
                res.end("<h1>404 - Archivo no encontrado</h1>");
            } else {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Error interno del servidor");
            }
        } else {
            res.writeHead(200, { "Content-Type": contentType });
            res.end(content, "utf-8");
        }
    });
};

// Crear el servidor
const servidor = http.createServer((req, res) => {
    const publicPath = path.join(__dirname, "public");
    const filePath = path.join(publicPath, req.url);

    // Si la ruta corresponde a un archivo estático, intenta servirlo
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        servirArchivoEstatico(filePath, res);
    } else {
        rutas(req, res); // Manejar otras rutas a través del router
    }
});

// Configuración del puerto
const PORT = 3000;
servidor.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
