import { Space } from './space';

export class Dict extends Space {
    public readonly spaces: Map<string, any> = new Map<string, any>();
    constructor(spaces?: { [key: string]: any }) {
        super([0], 'float64');
        if (spaces) {
            for (const k of Object.keys(spaces)) {
                this.spaces.set(k, spaces[k]);
            }
        }
    }
    contains(x: number): boolean {
        return false;
    }
    equal(other: Space): boolean {
        return false;
    }

    sample(): unknown {
        throw new Error();
    }
    toString(): string {
        return `Dict()`;
    }

}
