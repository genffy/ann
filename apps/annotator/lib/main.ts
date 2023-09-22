import register from 'preact-custom-element'
export function helloAnything(thing: string): string {
    return `Hello ${thing}!`
}
import { Dialog } from './components/Dialog'
export { Selection } from './components/Selection'
export { NodeSelect } from './components/NodeSelect'
import { Share } from './components/Share'

register(Share, 'ann-share', ['name'], { shadow: false });
register(Dialog, 'ann-dialog', ['name'], { shadow: false });


// auto-generate these types using: https://github.com/coryrylan/custom-element-types
type CustomEvents<K extends string> = { [key in K]: (event: CustomEvent) => void };
type CustomElement<T, K extends string = ''> = Partial<T & { children: any } & CustomEvents<`on${K}`>>;

declare global {
    namespace preact.createElement.JSX {
        interface IntrinsicElements {
            ['ann-share']: CustomElement<Share, 'name'>;
            ['ann-dialog']: CustomElement<Dialog, 'closeChange'>;
        }
    }
}
