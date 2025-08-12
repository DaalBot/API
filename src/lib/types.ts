export interface RouteMetadata {
    description: string;
    body: Record<string, { description: string, type: string, required: boolean, example?: string }> | null;
    query: Record<string, { description: string, type: string, required: boolean, example?: string }> | null;
    authorization: 'None' | 'Guild' | 'Locked' | 'User' | 'CI';
    returns: Record<number, { type: string, example: string | null }[]> | null;
    comment: string | null;
    rate?: {
        window: number; // In seconds, determines the window from the first request until it resets
        limit: number; // The maximum number of requests allowed in the window
    }
}