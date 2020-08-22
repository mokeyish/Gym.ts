import { DataType, Ix } from '@tszone/ndarray';
import { assert } from '@tszone/ext';


export abstract class Space {
    public readonly shape?: Ix;
    public readonly dtype?: DataType;
    protected constructor(shape?: Ix, dtype?: DataType) {
        assert(dtype !== undefined, 'dtype must be explicitly provided.')
        this.shape = shape;
        this.dtype = dtype;
        this.seed();
    }
    abstract sample(): unknown;
    seed(seed?: number): number[] {
        return [Math.random()];
    }
    abstract contains(x: unknown): boolean;
    abstract equal(other: Space): boolean;
    abstract toString(): string;
}
