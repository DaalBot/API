interface RouteMetadataParams {
    description: string,
    type: string,
    required: boolean,
    example?: string
}

export interface RouteMetadata {
    /**
     * A description of what the hell the route does
    */
    description: string;
    /**
     * The parameters expected in the request body
    */
    body: Record<string, RouteMetadataParams> | null;
    /**
     * The parameters expected in the request query string
    */
    query: Record<string, RouteMetadataParams> | null;
    /**
     * The authorization level required to access the route, this stacks on top of any dashboard authorization.
    */
    authorization: 'None' | 'Guild' | 'Locked' | 'User' | 'CI';
    /**
     * The possible return codes and their types/examples
    */
    returns: Record<number, {
        type: string,
        description?: string,
        example: string | null
    }[]> | null;
    /**
     * The comment to show alongside the route in activity logs
    */
    comment: string | null;
    rate?: { // Legacy, this is now handled at the network level
        window: number; // In seconds, determines the window from the first request until it resets
        limit: number; // The maximum number of requests allowed in the window
    }
}