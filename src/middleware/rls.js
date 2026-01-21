/*
1. Usuario envia request con JWT
2. JWT  contiene ID del usuario y el username: "yoel"
3. Middleware agrega un Where userid = 1
4. Query: SELECT * FROM records WHERE userid = 1
5. Usuario solo puede acceder a sus propios registros
 */

function buildRLSFilter(user) {
    if (user.role === "admin") {
        return { clause: "1=1", params: [] };
    }
    return { clause: "userid = ?", params: [user.id] };
}

//Verificar si el usuario es dueñp del un registro en especifico

async function verifyUserOwnership(userId, recordId) {
    const [rows] = await pool.execute("SELECT * FROM records WHERE id = ? AND userid = ?", [recordId]);
    if (rows.length === 0) {
        return false;//refistro no existe
    }
    return rows[0].userid === userId;// Es el dueño del registro?
}
export { buildRLSFilter, verifyUserOwnership };