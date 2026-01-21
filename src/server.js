import dotenv from "dotenv";
dotenv.config();
import Fastify from "fastify";

// Crear instancia de Fastify
const app = Fastify({
    logger: true
});

// Plugins


// Rutas


// Middleware


// Configuración de base de datos
import { testConnection } from "./config/database.js";  // ← Añade .js

async function startServer() {
    try {
        await testConnection();
        await app.listen({
            port: process.env.PORT || 3000,
            host: "0.0.0.0"
        });
        console.log("Server running on port", process.env.PORT || 3000);
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
}

// ¡Ejecutar el servidor!
startServer();