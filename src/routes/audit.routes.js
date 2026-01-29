import { pool } from "../config/database.js";

export default async function auditRoutes(fastify, options) {

    //get
    fastify.get('/', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {

            const limit = request.query.limit || 50;

            const [records] = await pool.execute(`SELECT * FROM audit_logs LIMIT ? 
                 ORDER BY id DESC`, [limit]);

            return reply.status(200).send({
                message: "Registros obtenidos exitosamente",
                count: records.length,
                records
            });
        } catch (error) {
            reply.status(500).send({
                error: "Internal server error",
                message: error.message
            });
        }
    })

}