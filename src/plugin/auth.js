import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import dotenv from "dotenv";
dotenv.config();

async function authPlugin(fastify, options) {
    fastify.register(jwt, {
        secret: process.env.JWT_SECRET,
    });

    // Verificar si el usuario está autenticado
    fastify.decorate("authenticate", async function (request, reply) {
        try {
            await request.jwtVerify();
        } catch (error) {
            reply.status(401).send({
                error: "Unauthorized",
                message: "Invalid token"
            });
            return reply;
        }
    });

    // Verificar si el usuario es admin (debe usarse después de authenticate)
    fastify.decorate("requireAdmin", async function (request, reply) {
        if (request.user?.role !== "admin") {
            reply.status(403).send({
                error: "Forbidden",
                message: "Admin role required"
            });
            return reply;
        }
    });
}

export default fp(authPlugin);