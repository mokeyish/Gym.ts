import { Space } from './space';
import { DataType, float32, IxA, NdArray } from '@tszone/ndarray';
import { assert } from '@tszone/ext';


/**
 * A （possibly unbounded） box in R^n. Specifically, a Box represents the
 * Cartesian product of n closed intervals. Each interval hash the form of one
 * of [a, b], (-oo, b], [a, oo), or (-oo, oo).
 *
 * There are two common use cases:
 *
 * - Identical bound for each dimension::
 *     >>> Box(low=-1.0, high=2.0, shape=(3, 4), dtype=float32)
 *     Box(3, 4)
 * - Independent bound for each dimension::
 *     >>> Box(low=[-1.0, -2.0], high=[2.0, 4.0], dtype=float32)
 *      Box(2, )
 */
export class Box extends Space {
    public readonly low: NdArray<number>;
    public readonly high: NdArray<number>;
    public readonly boundedBelow: NdArray<boolean>;
    public readonly boundedAbove: NdArray<boolean>;
    constructor(low: NdArray<number> | number, high: NdArray<number> | number, shape?: IxA, dtype: DataType = float32) {
        // determine shape if it isn't provided directly
        if (shape) {
            assert(typeof low === 'number' || low.shape.sequenceEqual(shape), 'low.shape doesn\'t match provided shape');
            assert(typeof high === 'number' || high.shape.sequenceEqual(shape), 'high.shape doesn\'t match provided shape');
        } else if (typeof low !== 'number') {
            shape = low.shape;
            assert(typeof high === 'number' || high.shape.sequenceEqual(shape), 'high.shape doesn\'t match low.shape')
        } else if (typeof high !== 'number') {
            shape = high.shape;
        } else {
            throw new Error('shape must be provided or inferred from the shapes of low or high');
        }
        super(shape, dtype);
        if (typeof low === 'number') {
            low = NdArray.full(shape, low, dtype);
        }
        if (typeof high === 'number') {
            high = NdArray.full(shape, high, dtype);
        }
        this.low = low;
        this.high = high;
        this.boundedBelow = this.low.map((x: number) => -Infinity < x);
        this.boundedAbove = this.high.map((x: number) => Infinity > x);
    }
    isBounded(manner: 'both' | 'below' | 'above' = 'both'): boolean {
        const bellow = this.boundedBelow.all();
        const above = this.boundedAbove.all();
        switch (manner) {
            case 'both':
                return bellow && above;
            case 'below':
                return bellow;
            case 'above':
                return above;
            default:
                throw new Error('manner is not in {"below", "above", "both"}');
        }
    }
    contains(x: number): boolean {
        return false;
    }

    equal(other: Space): boolean {
        return false;
    }

    sample(): NdArray<number> {
        throw new Error();
    }
    toString(): string {
        return `Box${this.shape}`;
    }
}
