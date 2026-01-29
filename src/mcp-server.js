import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DB_CONFIG = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER_MCP || 'mcp_agent',
    password: process.env.DB_PASSWORD_MCP,
    database: process.env.DB_NAME
};

const server = new Server(
    {
        name: "MCP Server",
        version: "1.0.0",
    },
    { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "db_readonly",
                description: "Consulta segura de información financiera",
                inputSchema: {
                    type: "object",
                    properties: {
                        query_type: {
                            type: "string",
                            enum: ["balance", "get_last_transactions"],
                            description: "Tipo de consulta"
                        },
                        account_id: {
                            type: "integer",
                            description: "ID del usuario"
                        }
                    },
                    required: ["query_type", "account_id"]
                }
            }
        ]
    };
});

const InputSchema = z.object({
    query_type: z.enum(["balance", "get_last_transactions"]),
    account_id: z.number().int().positive()
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== 'db_readonly') {
        throw new Error("Tool not found");
    }

    try {
        const { query_type, account_id } = InputSchema.parse(request.params.arguments);
        const connection = await mysql.createConnection(DB_CONFIG);

        try {
            await connection.execute(
                "SET @app_current_user_id = ?",
                [account_id]
            );

            let result;
            if (query_type === "balance") {
                const [rows] = await connection.execute(
                    "SELECT SUM(amount) as total_balance FROM financial_records_secure"
                );
                result = rows[0].total_balance || 0;
            } else {
                const [rows] = await connection.execute(
                    "SELECT * FROM financial_records_secure ORDER BY created_at DESC LIMIT 5"
                );
                result = rows;
            }

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }]
            };
        } finally {
            await connection.end();
        }
    } catch (error) {
        return {
            content: [{
                type: "text",
                text: `Error: ${error.message}`
            }],
            isError: true
        };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Server started");
}

main().catch(console.error);