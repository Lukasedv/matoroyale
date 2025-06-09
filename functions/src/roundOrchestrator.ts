import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as df from 'durable-functions';

export async function roundOrchestrator(context: InvocationContext): Promise<void> {
    const client = df.getClient(context);
    
    // Start the round orchestration
    const instanceId = await client.startNew('roundOrchestratorFunction', {
        input: {
            roundDuration: 90000, // 90 seconds
            resetDelay: 10000,    // 10 seconds between rounds
            autoRestart: true
        }
    });

    context.log(`Started round orchestration with ID = '${instanceId}'`);
    
    return client.createCheckStatusResponse({ request: context.req as any }, instanceId);
}

app.http('roundOrchestrator', {
    methods: ['POST'],
    authLevel: 'function',
    handler: roundOrchestrator,
    extraInputs: [df.input.durableClient()]
});

export async function roundOrchestratorFunction(context: InvocationContext): Promise<void> {
    const input = df.getInput(context);
    const gameEngineUrl = process.env.GAME_ENGINE_URL || 'http://localhost:3001';
    
    context.log('🎮 Round orchestrator started', input);

    try {
        while (true) {
            // Phase 1: Start round
            context.log('🚀 Starting new round...');
            yield context.df.callActivity('startRound', { gameEngineUrl });
            
            // Phase 2: Wait for round duration
            context.log(`⏱️  Round running for ${input.roundDuration}ms...`);
            yield context.df.createTimer(new Date(Date.now() + input.roundDuration));
            
            // Phase 3: End round
            context.log('🏁 Ending round...');
            const results = yield context.df.callActivity('endRound', { gameEngineUrl });
            
            // Phase 4: Wait before reset
            context.log(`⏸️  Waiting ${input.resetDelay}ms before reset...`);
            yield context.df.createTimer(new Date(Date.now() + input.resetDelay));
            
            // Phase 5: Reset arena
            context.log('🔄 Resetting arena...');
            yield context.df.callActivity('resetArena', { gameEngineUrl });
            
            // Check if we should continue
            if (!input.autoRestart) {
                break;
            }
            
            // Small delay before next round
            yield context.df.createTimer(new Date(Date.now() + 5000));
        }
    } catch (error) {
        context.log.error('❌ Round orchestrator error:', error);
        throw error;
    }
}

app.orchestration('roundOrchestratorFunction', roundOrchestratorFunction);
