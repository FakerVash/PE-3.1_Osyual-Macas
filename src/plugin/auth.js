import fp from "@fastify-plugin";
import jwt from "@fastify/jwt";
import dotenv from "dotenv";
dotenv.config();

async function authPlugin(fastify, options) {
    fastify.register(jwt, {
        secret: process.env.JWT_SECRET,
    });

    //verificar si el usuario esta autenticado
    fastify.decorateRequest("authenticate", async function (request, reply) {
        try {
            await request.jwtVerify();
        } catch (error) {
            reply.status(401).send({
                error: "Unauthorized",
                message: "Invalid token"
            });
        }
    });

    //verificar si el usuario es admin
    fastify.decorateRequest("requireAdmin", async function (request, reply) {
        try {
            const { role } = request.user;
            if (role !== "admin") {
                reply.status(403).send({
                    error: "Forbidden",
                    message: "Admin role required"
                });
            }
        } catch (error) {
            reply.status(401).send({
                error: "Unauthorized",
                message: "Invalid token"
            });
        }
    });
}

export default fp(authPlugin);