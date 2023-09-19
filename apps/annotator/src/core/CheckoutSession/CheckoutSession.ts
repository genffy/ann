import Storage from '../../utils/Storage';
import { CheckoutSession } from '../types';
import { sanitizeSession } from './utils';

class Session {
    private readonly session: CheckoutSession;
    private readonly storage: Storage<CheckoutSession>;
    public readonly clientKey: string;
    public readonly loadingContext: string;

    constructor(rawSession: CheckoutSession, clientKey: string, loadingContext: string) {
        const session = sanitizeSession(rawSession) as CheckoutSession;

        if (!clientKey) throw new Error('No clientKey available');
        if (!loadingContext) throw new Error('No loadingContext available');

        this.storage = new Storage('session', 'localStorage');
        this.clientKey = clientKey;
        this.loadingContext = loadingContext;
        this.session = session;

        if (!this.session.sessionData) {
            this.session = this.getStoredSession();
        } else {
            this.storeSession();
        }
    }

    get id() {
        return this.session.id;
    }

    get data() {
        return this.session.sessionData;
    }
    setupSession(options): Promise<any> {
        // TODO: check if session is valid
        return new Promise((resolve, reject) => {
            if (this.session.sessionData) {
                resolve({});
            } else {
                reject(new Error('No sessionData available'));
            }
        })
    }

    getStoredSession(): CheckoutSession {
        const storedSession = this.storage.get();
        return this.id === storedSession?.id ? storedSession : this.session;
    }

    storeSession(): void {
        this.storage.set({ id: this.session.id, sessionData: this.session.sessionData });
    }
    removeStoredSession(): void {
        this.storage.remove();
    }
}

export default Session;
