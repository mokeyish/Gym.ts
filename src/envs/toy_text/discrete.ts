import { Env, EnvArgs, Observation, Step } from '../../env';
import { array1d, NdArray } from '@tszone/ndarray';
import { Discrete } from '../../spaces';
import { Seeding } from '../../utils';
import { Random } from '@tszone/ext';

export interface DiscreteEnvArgs extends EnvArgs {
    /**
     * number of states
     */
    nS: number;

    /**
     * number of actions
     */
    nA: number;

    /**
     * transitions (*)
     */
    P: [number, number, number, boolean][][][];

    /**
     * initial state distribution (**)
     */
    isd: NdArray<number>;
}

/**
 * Sample for categorical distribution
 * Each row specifies class probabilities
 * @param probN
 * @param random
 */
function categoricalSample(probN: NdArray<number> | number[], random: Random): number {
    if (probN instanceof Array) {
        probN = array1d(probN);
    }
    const n = probN.cumsum();
    return n.map(v => v > random.real() ? 1 : 0).argmax();
}

/**
 * Has the following members
 * - nS: number of states
 * - nA: number of actions
 * - P: transitions (*)
 * - isd: initial state distribution (**)
 *
 * (*) dictionary dict of dicts of lists, where
 *     P[s][a] == [(probability, nextState, reward, done), ...]
 * (**) list of array of length nS
 */
export abstract class DiscreteEnv extends Env{
    private random!: Random;

    /**
     * number of states
     */
    nS: number;

    /**
     * number of actions
     */
    nA: number;

    /**
     * transitions (*)
     */
    P: [number, number, number, boolean][][][];

    /**
     * initial state distribution (**)
     */
    isd: NdArray<number>;

    lastAction?: number; // for rendering
    s: number;
    protected constructor(args: DiscreteEnvArgs) {
        super(args);
        const { nS, nA, P, isd } = args;
        this.P = P;
        this.isd = isd;
        this.nS = nS;
        this.nA = nA;

        this.actionSpace = new Discrete(this.nA);
        this.observationSpace = new Discrete(this.nS);

        this.seed();

        this.s = categoricalSample(this.isd, this.random);
    }

    seed(seed?: number | string): number[] {
        const [random, seed1] = Seeding.random(seed);
        this.random = random;
        return [seed1];
    }

    reset(args?: { [p: string]: any }): Observation {
        this.s = categoricalSample(this.isd, this.random);
        this.lastAction = undefined;
        return array1d([this.s]);
    }


    step(action: number): Step {
        const transitions = this.P[this.s][action];
        const i = categoricalSample(transitions.map(v => v[0]), this.random);
        const [p, s, reward, done] = transitions[i];
        this.s = s;
        this.lastAction = action;
        return { observation: array1d([s]), reward, done, info: { 'prob': p } };
    }
}


