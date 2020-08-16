/**
 * Created by yish on 2020/08/12.
 */
import { Discrete } from './discrete';

describe('Discrete', () => {
    it('Contains', () => {
        const space = new Discrete(8);
        const x = space.sample();
        expect(space.contains(x)).toEqual(true);
        expect(space.n).toEqual(8);
    })
})
