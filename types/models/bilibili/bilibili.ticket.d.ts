export declare function getBiliTicket(csrf: string | null): Promise<{
    code?: number;
    ticket?: string;
    created_at?: number;
    ttl?: number;
}>;
