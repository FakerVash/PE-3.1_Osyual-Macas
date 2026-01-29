import { pool } from "../config/database.js";
import { buildRLSFilter, verifyUserOwnership } from "../middleware/rls.js";

export default async function recordsRoutes(fastify, options) {
    fastify.addHook("onRequest", fastify.authenticate);

    fastify.get('/', async (request, reply) => {
        try {
            const { clause, params } = buildRLSFilter(request.user);
            const [records] = await pool.execute(
                `SELECT * FROM financial_records WHERE ${clause} ORDER BY created_at DESC`,
                params
            );
            return reply.status(200).send({
                message: "Registros obtenidos por RLS",
                userId: request.user.id,
                rlsFilter: request.user.role === 'admin' ? 'ADMIN' : `userid = ${request.user.id}`,
                count: records.length,
                records
            });
        } catch (error) {
            reply.status(500).send({ error: "Internal server error", message: error.message });
        }
    });

    fastify.post('/', async (request, reply) => {
        const { amount, category, description } = request.body;
        const userId = request.user.id;
        try {
            const [result] = await pool.execute(
                `INSERT INTO financial_records (user_id, amount, category, description) VALUES (?, ?, ?, ?)`,
                [userId, amount, category, description]
            );
            return reply.status(201).send({
                message: "Registro creado exitosamente",
                recordId: result.insertId
            });
        } catch (error) {
            reply.status(500).send({ error: "Internal server error", message: error.message });
        }
    });

    fastify.put('/:id', async (request, reply) => {
        const { id } = request.params;
        const { amount, category, description } = request.body;
        const userId = request.user.id;
        const isAdmin = request.user.role === 'admin';

        try {
            if (!isAdmin) {
                const isOwner = await verifyUserOwnership(pool, 'financial_records', id, userId);
                if (!isOwner) {
                    return reply.status(403).send({
                        error: "Forbidden",
                        message: "No tienes permiso para actualizar este registro"
                    });
                }
            }
            // Update runs for both admins and owners
            await pool.execute(
                `UPDATE financial_records SET amount = ?, category = ?, description = ? WHERE id = ?`,
                [amount, category, description, id]
            );
            return reply.status(200).send({
                message: "Registro actualizado exitosamente",
                recordId: id
            });
        } catch (error) {
            reply.status(500).send({ error: "Internal server error", message: error.message });
        }
    });

    fastify.delete('/:id', async (request, reply) => {
        const { id } = request.params;
        const userId = request.user.id;
        const isAdmin = request.user.role === 'admin';

        try {
            if (!isAdmin) {
                const isOwner = await verifyUserOwnership(pool, 'financial_records', id, userId);
                if (!isOwner) {
                    return reply.status(403).send({
                        error: "Forbidden",
                        message: "No tienes permiso para eliminar este registro"
                    });
                }
            }
            await pool.execute(`DELETE FROM financial_records WHERE id = ?`, [id]);
            return reply.status(200).send({
                message: "Registro eliminado exitosamente",
                recordId: id
            });
        } catch (error) {
            reply.status(500).send({ error: "Internal server error", message: error.message });
        }
    });
}