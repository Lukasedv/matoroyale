import { app, InvocationContext } from '@azure/functions';
import axios from 'axios';

export async function startRound(input: any, context: InvocationContext): Promise<any> {
    const { gameEngineUrl } = input;
    
    try {
        const response = await axios.post(`${gameEngineUrl}/admin/start-round`, {}, {
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        context.log('✅ Round started successfully:', response.data);
        return response.data;
    } catch (error) {
        context.log.error('❌ Failed to start round:', error);
        throw error;
    }
}

export async function endRound(input: any, context: InvocationContext): Promise<any> {
    const { gameEngineUrl } = input;
    
    try {
        const response = await axios.post(`${gameEngineUrl}/admin/end-round`, {}, {
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        context.log('✅ Round ended successfully:', response.data);
        return response.data;
    } catch (error) {
        context.log.error('❌ Failed to end round:', error);
        throw error;
    }
}

export async function resetArena(input: any, context: InvocationContext): Promise<any> {
    const { gameEngineUrl } = input;
    
    try {
        const response = await axios.post(`${gameEngineUrl}/admin/reset-arena`, {}, {
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        context.log('✅ Arena reset successfully:', response.data);
        return response.data;
    } catch (error) {
        context.log.error('❌ Failed to reset arena:', error);
        throw error;
    }
}

// Register activity functions
app.activity('startRound', { handler: startRound });
app.activity('endRound', { handler: endRound });
app.activity('resetArena', { handler: resetArena });
