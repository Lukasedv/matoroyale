import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

// Simplified HTTP trigger for manual round control
export async function startRoundHttp(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        context.log('🎮 Manual round start requested');
        
        // In a real implementation, this would trigger the game engine
        // For now, return success
        return {
            status: 200,
            jsonBody: {
                message: 'Round orchestration triggered',
                timestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        context.log('❌ Round orchestrator error:', error);
        return {
            status: 500,
            jsonBody: {
                error: 'Failed to start round orchestration'
            }
        };
    }
}

app.http('startRound', {
    methods: ['POST'],
    authLevel: 'function',
    handler: startRoundHttp
});
