import { Dict, Space } from './spaces';
import { array1d, NdArray } from '@tszone/ndarray';

export type EnvArgs = { [key: string]: any };

/**
 * The main AI Gym class. It encapsulates an environment with
 * arbitrary behind-the-scenes dynamics. An environment can be
 * partially or fully observed.
 *
 * The main API methods that users of this class need to know are:
 *
 *     step
 *     reset
 *     render
 *     close
 *     seed
 *
 * And set the following attributes:
 *     actionSpace: The Space object corresponding to valid actions
 *     observationSpace: The Space object corresponding to valid observations
 *     rewardRange: A tuple corresponding to the min and max possible rewards
 *
 * Note: a default reward range set ro [-inf, +inf] already exists. Set it if you want a narrower range.
 *
 * The methods are accessed publicly as "step", "reset", etc...
 */
export abstract class Env {
    // Set this in SOME subclasses
    public readonly metadata: { 'render.modes': string [], [key: string]: any } = { 'render.modes': [] };
    rewardRange: [number, number] = [ -Infinity, Infinity ];
    spec: any;

    // Set these in All subclasses
    actionSpace?: Space;
    observationSpace?: Space;
    protected constructor(args: EnvArgs) {
        const { actionSpace,  observationSpace} = args;
        this.actionSpace = actionSpace;
        this.observationSpace = observationSpace;
    }

    /**
     * Run one time step of the environments's dynamics. When end of
     * episode is reached, your are responsible for calling `reset()`
     * to reset this environment's state.
     *
     * Accepts an action and returns a tuple (observation, reward, done, info).
     *
     * @param action (object): an action provided by the agent
     * @return Step
     */
    abstract step(action: unknown): Step;

    /**
     * Resets the state of the environment and returns an initial observation.
     * @param args
     * @return Observation (object): the initial observation
     */
    abstract reset(args?: { [key: string]: any}): Observation;

    /**
     * Renders the environment
     *
     * The set of supported modes varies per environment. (And some
     * environments do not support rendering at all.) By convention,
     * if mode is:
     *
     * - human: render to the current display or terminal and
     *   return nothing. Usually for human consumption.
     * - rgb_array: Return an a numpy.ndarray with shape (x, y, 3),
     *   representing RGB values for an x-by-y pixel image, suitable
     *   for turning into a video.
     * - ansi: Return a string containing a terminal-style text representation.
     *   The text can include newlines and ANSI escape sequences (e.g. for colors).
     *
     *  Note:
     *      Make sure that your class's metadata 'render.modes' key includes
     *      the list of supported modes. It's recommended to call super()
     *      in implementations to use the functionality of this method.
     * @param mode (str): the mode to render with
     * @param args
     * @example:
     *     class MyEnv extends Env {
     *         render(mode: RenderMode = 'human'): any {
     *             if (mode === 'rgb_array') {
     *                 return np.array(...) // return RGB frame suitable for video
     *             } else (mode === 'human') {
     *                 ... // pop up a winder and render
     *             } else {
     *                 super.render(mode) // just throw an exception
     *             }
     *         }
     *     }
     */
    abstract render(mode?: RenderMode, args?: { [p: string]: any }): any;

    /**
     * Sets the seed for this env's random number generator(s).
     *
     * Note:
     *     Some environments use multiple pseudorandom number generators.
     *     We want to capture all such seeds used in order to ensure that
     *     there aren't accidental correlations between generators.
     * @param seed
     * @return:
     *     bigint[]: Returns the list of seeds used in this env's random
     *     number generators. The first value in the list should be the
     *     "main" seed, or the value which reproducer should pass to
     *     'seed'. Often, the main seed equals the provided 'seed', but
     *     this won't be true if seed is undefined, for example
     */
    abstract seed(seed?: number | string): number[];

    /**
     * Completely unwrap this env.
     * @return:
     *     gym.Env: The base non-wrapped gym.Env instance
     */
    get unwrapped(): Env {
        return this;
    }

    /**
     * Override close in your subclass to perform any necessary cleanup.
     *
     * Environments will automatically close() themselves when
     * garbage collected or when the program exists.
     */
    close(): void {
        // do nothing
    }

    /**
     * Compute the step reward. this externalizes the reward function and makes
     * it dependent on a desired goal an the one that was achieved. If you wish to include
     * additional rewards that are independent of the goal, you can include the necessary values
     * to derive it in 'info' and compute it accordingly.
     * @param achievedGoal (object): the goal that was achieved during execution
     * @param desiredGoal (object): the desired goal that we asked the agent to attempt ro achieve
     * @param info (dict): an info dictionary additional information
     * @return:
     *     float: The reward that corresponds to the provided achieved goal w.r.t. to the desired
     *     goal. Note that the following should always hold true:
     *
     *        const { ob, reward, done, info } = env.step()
     *        assert reward === env.computeReward(ob['achievedGoal'], ob['goal'], info)
     */
    computeReward(achievedGoal: any, desiredGoal: any, info: any): number {
        throw new Error('computeReward is unimplemented');
    }

    toString(): string {
        return Object.getPrototypeOf(this).constructor.name;
    }
}


/**
 * A goal-based environment. It functions just as ant regular AI Gym environment but it
 * imposes a required structure on the observationSpace. More concretely, the observation
 * space is required to contain at least three elements, namely `observation`, `desireGoal`, and
 * `achievedGoal`. Here, `desiredGoal` specifies the goal that the agent should attempt to achieve.
 * `schievedGoal` is the goal that it currently achieved instead. `observation` contains the
 * actual observations of the environment as per usual.
 */
export abstract class GoalEnv extends Env {
    reset(): Observation {
        // Enforce that each GoalEnv uses a Goal-compatible observation space.
        if (!(this.observationSpace instanceof Dict)) {
            throw new Error('GoalEnv requires an observation space of type gym.spaces.Dict')
        }
        for (const key of ['observation', 'achieved_goal', 'desired_goal']) {
            if (!this.observationSpace.spaces.has(key)) {
                throw new Error(`GoalEnv requires the "${key}" key to be part of the observation dictionary`);
            }
        }
        return array1d([]);
    }

    abstract computeReward(achievedGoal: any, desiredGoal: any, info: any): number;
}

/**
 * Wraps the environment to allow a modular transformation.
 *
 * This class is the base class for all wrappers. The subclass should override
 * some methods to change the behavior of the original environment without touching the original code.
 */
export abstract class Wrapper extends Env {
    protected constructor(public env: Env) {
        super(env);
    }
    get spec(): any {
        return this.env.spec;
    }
    step(action: any): Step {
        return this.env.step(action);
    }

    reset(args?: { [p: string]: any }): Observation {
        return this.env.reset(args);
    }

    render(mode: RenderMode = 'human', args?: { [p: string]: any }): any {
        return this.env.render(mode, args);
    }

    close() {
        this.env.close();
    }

    seed(seed?: number): number[] {
        return  this.env.seed(seed);
    }

    computeReward(achievedGoal: any, desiredGoal: any, info: any): any {
        return this.env.computeReward(achievedGoal, desiredGoal, info);
    }

    get unwrapped(): Env {
        return this.env.unwrapped;
    }

    toString(): string {
        return `<${super.toString()}${this.env.toString()}>`;
    }
}

export abstract class ObservationWrapper extends Wrapper {
    reset(args: { [key: string]: any }): Observation {
        const observation = this.env.reset(args);
        return this.observation(observation);
    }
    step(action: any): Step {
        const { observation, reward, done, info} = this.env.step(action);
        return { observation: this.observation(observation), reward, done, info };
    }

    abstract observation(observation?: { [key: string]: any }): any;
}


export abstract class RewardWrapper extends Wrapper {
    reset(args?: { [p: string]: any }): any {
        return this.env.reset(args);
    }
    step(action: any): Step {
        const { observation, reward, done, info } = this.env.step(action);
        return { observation, reward: this.reward(reward), done, info };
    }
    abstract reward(reward: any): any;
}

export abstract class ActionWrapper extends Wrapper {
    reset(args?: { [p: string]: any }): any {
        return super.env.reset(args);
    }
    step(action: any): Step {
        return super.env.step(this.action(action));
    }
    abstract action(action: any): any;
    abstract reverseAction(action: any): any;
}

export interface Step {
    /**
     * observation (object): agent's observation of the current environment
     * info (dict): contains auxiliary diagnostic information (helpful for debugging, and sometimes learning)
     */
    observation: Observation;

    /**
     * reward (float): amount of reward returned after previous action
     */
    reward: number;

    /**
     * done (bool): whether the episode has ended, in which case further step() calls will return undefined results
     */
    done: boolean;

    /**
     * info (dict): contains auxiliary diagnostic information (helpful for debugging, and sometimes learning)
     */
    info: any;
}

export type Observation = NdArray<number>;

export type RenderMode = 'human' | 'rgb_array' | 'ansi';
