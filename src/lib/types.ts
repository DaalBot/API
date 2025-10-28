export interface RouteMetadata {
    /**
     * A description of what the hell the route does
    */
    description: string;
    /**
     * The parameters expected in the request body
    */
    body: Record<string, { description: string, type: string, required: boolean, example?: string }> | null;
    /**
     * The parameters expected in the request query string
    */
    query: Record<string, { description: string, type: string, required: boolean, example?: string }> | null;
    /**
     * The authorization level required to access the route, this stacks on top of any dashboard authorization.
    */
    authorization: 'None' | 'Guild' | 'Locked' | 'User' | 'CI';
    /**
     * The possible return codes and their types/examples
    */
    returns: Record<number, { type: string, example: string | null }[]> | null;
    /**
     * The comment to show alongside the route in activity logs
    */
    comment: string | null;
    rate?: {
        window: number; // In seconds, determines the window from the first request until it resets
        limit: number; // The maximum number of requests allowed in the window
    }
}