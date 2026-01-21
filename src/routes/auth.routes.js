import bcrypt from "bcryptjs";
import { pool } from "../config/database.js";

async function authRoutes(fastify, options) {

    // REGISTRO
    fastify.post("/register", {
        schema: {
            body: {
                type: "object",
                required: ["username", "password"],
                properties: {
                    username: { type: "string" },
                    password: { type: "string" },
                },
            },
        },
    }, async (request, reply) => {
        const { username, password } = request.body;

        try {
            // Verificar si el usuario ya existe
            const [existingUser] = await pool.query(
                "SELECT * FROM users WHERE username = ?",
                [username]
            );

            if (existingUser.length > 0) {
                return reply.status(400).send({
                    message: "User already exists"
                });
            }

            // Hashear contraseña (10 rondas de salt)
            const hashedPassword = await bcrypt.hash(password, 10);

            await pool.query(
                "INSERT INTO users (username, password_hash) VALUES (?, ?)",
                [username, hashedPassword]
            );

            return reply.status(201).send({
                message: "User registered successfully"
            });

        } catch (error) {
            console.error("Error registering user:", error);
            return reply.status(500).send({
                error: "Internal server error",
                message: "Internal server error"
            });
        }
    });

    // LOGIN
    fastify.post("/login", {
        schema: {
            body: {
                type: "object",
                required: ["username", "password"],
                properties: {
                    username: { type: "string" },
                    password: { type: "string" },
                },
            },
        },
    }, async (request, reply) => {
        const { username, password } = request.body;

        try {
            const [users] = await pool.query(
                "SELECT * FROM users WHERE username = ?",
                [username]
            );

            if (users.length === 0) {
                return reply.status(401).send({
                    error: "Unauthorized",
                    message: "Invalid credentials"
                });
            }

            const user = users[0];

            // Comparar contraseña con el hash almacenado
            const validPassword = await bcrypt.compare(password, user.password_hash);

            if (!validPassword) {
                return reply.status(401).send({
                    error: "Unauthorized",
                    message: "Invalid credentials"
                });
            }

            // Generar JWT
            const token = fastify.jwt.sign({
                id: user.id,
                username: user.username,
                role: user.role
            }, {
                expiresIn: "1h"
            }
            );

            return reply.status(200).send({
                message: "Login successful",
                token
            });

        } catch (error) {
            console.error("Error logging in:", error);
            return reply.status(500).send({
                error: "Internal server error",
                message: "Internal server error"
            });
        }
    });
}

export default authRoutes;