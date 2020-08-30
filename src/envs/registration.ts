/**
 * Created by yish on 2020/08/11.
 */
import { Env, EnvArgs } from '../env';

export type EntryPoint = new(args: EnvArgs) => Env;

/**
 * A specification for a particular instance of environment. Used
 * to register the parameters for official evaluations.
 */
export class EnvSpec {
    public readonly id: string;
    public readonly entryPoint: EntryPoint;
    public readonly rewardThreshold?: number[];
    public readonly nondeterministic: boolean = false;
    public readonly maxEpisodeSteps?: number[];
    public readonly args: EnvArgs;

    /**
     * Init a EnvSpec instance.
     * @param id (str): The official environment ID
     * @param entryPoint （Optional[str]): The entryPoint of the environment class (e.g. class Type)
     * @param rewardThreshold（Optional[int]): The reward threshold before the task is considered solved
     * @param nondeterministic (bool): Whether this environment is non-deterministic even after seeding
     * @param maxEpisodeSteps（Optional[int]): The maximum number of steps that an episode can consist of
     * @param args (dict): The args to pass to the environment class
     */
    constructor(id: string, entryPoint: EntryPoint, rewardThreshold?: number[],
                nondeterministic: boolean = false, maxEpisodeSteps?: number[],
                args?: EnvArgs) {
        this.id = id;
        this.entryPoint = entryPoint;
        this.rewardThreshold = rewardThreshold;
        this.nondeterministic = nondeterministic;
        this.maxEpisodeSteps = maxEpisodeSteps;
        this.args = args ?? { };
    }
    make<E extends Env = Env>(args?: EnvArgs): E {
        args = Object.assign({ }, this.args, args);
        return new this.entryPoint(args) as E;
    }
}

interface EnvSpecOptions extends EnvArgs {
    entryPoint: EntryPoint;
    rewardThreshold?: number[];
    nondeterministic?: boolean;
    maxEpisodeSteps?: number[];
}

/**
 * Register an env by ID. IDs remain stable over time and are
 * guaranteed to resolve to the same environment dynamics (or be
 * desupported). The goal is that results on particular environment
 * should always be comparable, and not depend on the version of the
 * code that was running.
 */
export class EnvRegistry {
    private readonly envSpecs: { [key: string]: any } = { };
    make<E extends Env = Env>(path: string, args?: EnvArgs ): E {
        return this.spec(path)?.make(args);
    }
    all(): EnvSpec[] {
        return Object.values(this.envSpecs);
    }
    spec(id: string): EnvSpec {
        return this.envSpecs[id];
    }
    register(id: string, args: EnvSpecOptions): EnvSpec {
        if (this.envSpecs[id]) {
            throw new Error(`Cannot re-register id: ${id}`);
        }
        return this.envSpecs[id] = new EnvSpec(id, args.entryPoint,
            args.rewardThreshold, args.nondeterministic, args.maxEpisodeSteps, args);
    }
}

// Have a global registry
const registry = new EnvRegistry();

export function register(id: string, args: EnvSpecOptions): EnvSpec {
    return registry.register(id, args);
}
export function make<E extends Env = Env>(id: string, args?: EnvArgs): E {
    return registry.make(id, args);
}
export function spec(id: string): EnvSpec {
    return registry.spec(id);
}
