
type PromiseResolve = typeof Promise.resolve;

type PromiseReject = typeof Promise.reject;

export interface CoreOptions {
    clientKey?: string;
    
    session?: any;
    /**
     * Use test.
     */
    environment?: 'local' | 'test' | 'pro' | string;
    /**
     * @internal
     */
    loadingContext?: string;
}

export type CheckoutSession = {
    id: string;
    sessionData: string;
};