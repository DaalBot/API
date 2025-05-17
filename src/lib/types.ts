export interface RouteMetadata {
    description: string;
    body: Record<string, { description: string, type: string, required: boolean, example?: string }> | null;
    query: Record<string, { description: string, type: string, required: boolean, example?: string }> | null;
    authorization: 'None' | 'Guild' | 'Locked' | 'User' | 'CI';
    returns: Record<number, { type: string, example: string | null }[]> | null;
    comment: string | null;
}