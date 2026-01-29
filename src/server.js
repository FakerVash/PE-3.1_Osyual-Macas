import dotenv from "dotenv";
dotenv.config();
import Fastify from "fastify";
//Plugins
import cors from "@fastify/cors";
import authPlugin from "./plugin/auth.js";
//Rutas
import recordsRoutes from "./routes/records.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import authRoutes from "./routes/auth.routes.js";

// Crear instancia de Fastify
const app = Fastify({
    logger: true
});

// Plugins

//middleware

// Configuración de base de datos
import { testConnection } from "./config/database.js";

async function startServer() {
    try {
        app.register(cors, {
            origin: "*"
        });
        app.register(authPlugin);
        app.register(recordsRoutes, { prefix: "/records" });
        app.register(authRoutes, { prefix: "/auth" });
        app.register(auditRoutes, { prefix: "/audit" });

        app.get("/", async (request, reply) => {
            reply.send("HI, HOLA, BIENVENIDO A LA API!");
        });
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