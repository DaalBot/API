export interface RouteMetadata {
    description: string;
    body: Record<string, { description: string, type: string, required: boolean }> | null;
    query: Record<string, { description: string, type: string, required: boolean }> | null;
    authorization: 'None' | 'Guild' | 'Locked' | 'User';
}