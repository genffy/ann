import { CoreOptions } from './types';
import Session from './CheckoutSession/index';

class Core {
    public session: Session;
    public modules: any;
    public options: CoreOptions;
    public components = [];

    public loadingContext?: string;

    public cdnContext?: string;

    public static readonly version = {
        version: process.env.VERSION,
        revision: process.env.COMMIT_HASH,
        branch: process.env.COMMIT_BRANCH,
        buildId: process.env.ANNHUB_BUILD_ID
    };

    constructor(props: CoreOptions) {
        this.setOptions(props);

        // Expose version number for npm builds
        window['annotatorWebVersion'] = Core.version.version;
    }

    initialize(): Promise<this> {
        if (this.options.session) {
            this.session = new Session(this.options.session, this.options.clientKey, this.loadingContext);

            return this.session
                .setupSession(this.options)
                .then(sessionResponse => {
                    // TODO: check if session is valid

                    return this;
                })
                .catch(error => {
                    return this;
                });
        }

        return Promise.resolve(this);
    }

    public update = (options: CoreOptions = {}): Promise<this> => {
        this.setOptions(options);

        return this.initialize().then(() => {
            // Update each component under this instance
            this.components.forEach(c => c.update(this.getPropsForComponent(this.options)));

            return this;
        });
    };

    public remove = (component): this => {
        this.components = this.components.filter(c => c._id !== component._id);
        component.unmount();

        return this;
    };

    private setOptions = (options: CoreOptions): void => {
        this.options = {
            ...this.options,
            ...options
        };
    };

    private getPropsForComponent(options) {
        // TODO
        return {
            _parentInstance: this
        };
    }
}

export default Core;
