#!/usr/bin/env node

// STDIO-based MCP server
process.stdin.setEncoding('utf8');

let buffer = '';

// Handle incoming data from stdin
process.stdin.on('data', (chunk) => {
    buffer += chunk;
    
    // Try to process complete JSON-RPC messages
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        
        if (line.trim()) {
            try {
                const request = JSON.parse(line);
                console.error('Received request:', request);
                
                // Handle the request
                handleRequest(request);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                sendError(null, -32700, 'Parse error', error.message);
            }
        }
    }
});

// Handle process termination
process.on('SIGINT', () => {
    console.error('Received SIGINT. Shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.error('Received SIGTERM. Shutting down...');
    process.exit(0);
});

// Send a message to stdout
function sendMessage(message) {
    process.stdout.write(JSON.stringify(message) + '\n');
}

// Send an error response
function sendError(id, code, message, data) {
    const error = {
        jsonrpc: '2.0',
        id,
        error: {
            code,
            message,
            data
        }
    };
    sendMessage(error);
}

// Send a notification
function sendNotification(method, params) {
    const notification = {
        jsonrpc: '2.0',
        method,
        params
    };
    sendMessage(notification);
}

// Handle incoming requests
function handleRequest(request) {
    if (!request.jsonrpc || request.jsonrpc !== '2.0') {
        return sendError(request.id, -32600, 'Invalid Request', 'Invalid JSON-RPC version');
    }

    // Handle method calls
    switch (request.method) {
        case 'initialize':
            // Send proper MCP initialization response
            sendMessage({
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    protocolVersion: request.params.protocolVersion,
                    capabilities: {
                        completions: {
                            maxTokens: 2048,
                            streaming: true,
                            models: ['test-model']
                        },
                        notifications: {
                            supported: true
                        }
                    },
                    serverInfo: {
                        name: 'test-mcp-server',
                        version: '1.0.0'
                    }
                }
            });

            // Send ready notification after initialization
            sendNotification('server/ready', {
                status: 'ready'
            });
            break;

        case 'complete':
            // Send a streaming completion response
            const messageId = request.id;
            
            // Send start of stream
            sendMessage({
                jsonrpc: '2.0',
                id: messageId,
                result: {
                    choices: [{
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: ''
                        }
                    }]
                }
            });

            // Stream some content
            let content = 'This is a test response from the MCP server.';
            for (let i = 0; i < content.length; i++) {
                setTimeout(() => {
                    sendNotification('completion/chunk', {
                        id: messageId,
                        choices: [{
                            index: 0,
                            delta: {
                                content: content[i]
                            }
                        }]
                    });

                    // If this is the last character, send end of stream
                    if (i === content.length - 1) {
                        sendNotification('completion/done', {
                            id: messageId
                        });
                    }
                }, i * 100); // Stream each character with 100ms delay
            }
            break;

        default:
            sendError(request.id, -32601, 'Method not found', `Method ${request.method} not supported`);
    }
}

// Send periodic heartbeat notifications
setInterval(() => {
    sendNotification('server/heartbeat', {
        timestamp: new Date().toISOString()
    });
}, 30000);

// Log startup
console.error('MCP test server running (STDIO mode)'); 