// /**
//  * Created by yish on 2020/08/11.
//  */
// import { Env, Observation, RenderMode, Step } from '../../env';
// import { array1d, NdArray } from 'ndarray4ts';
// import { assert } from 'ext4ts';
// import { MersenneTwister19937 } from 'random-js';
// import * as seedrandom from 'seedrandom';
//
// /**
//  * ## Description:
//  *     > A pole is attached by an un-actuated joint to a cart, which moves along
//  *     a frictionless track. The pendulum starts upright, and the goal is to
//  *     prevent is from falling over by increasing and reducing the cart's
//  *     velocity.
//  *
//  * ## Source:
//  *     > This environment corresponds to the version of the cart-pole problem
//  *     described by Barto, Sutton, and Anderson
//  *
//  *
//  * ## Observation:
//  *     Type: Box(4)
//  *     | Num | Observation           |   Min      |    Max     |
//  *     | --- |  ---                  |   ---      |    ---     |
//  *     | 0   | Cart position         |   -4.8     |    4.8     |
//  *     | 1   | Cart Velocity         |   -Inf     |    Inf     |
//  *     | 2   | Pole Angle            |   -24 deg  |    24 deg  |
//  *     | 3   | Pole Velocity At tip  |   -Inf     |    Inf     |
//  *
//  * ## Actions:
//  *     Type: Discrete(2)
//  *     | Num  |  Action            |
//  *     | ---  |  ---               |
//  *     | 0    | Push cart to left  |
//  *     | 1    | Push cart to right |
//  *
//  *     Note: The amount the velocity that is reduced or increased is not
//  *     fixed; it depends on the angle the pole is pointing. This is because
//  *     the center of gravity of the pole increases the amount of energy needed
//  *     to move the cart underneath it.
//  *
//  * ## Reward:
//  *     > Reward is 1 for every step taken, including the termination step
//  *
//  * ## Starting State:
//  *     > All observation are assigned a uniform random value in [-0.05..0.05]
//  *
//  * ## Episode Termination:
//  *     > Pole Angle is more that 12 degrees.
//  *     > Cart position is more than 2.4 (center if the cart reaches the edge of
//  *       the display).
//  *     > Episode length is greater than 200.
//  *     > Solved Requirements:
//  *       Considered solved when the average reward is greater than or equal to 195.0
//  *       over 100 consecutive trials.
//  */
// export class CartPole extends Env {
//     private gravity: number = 9.8;
//     private massCart = 1.0;
//     private massPole = 0.1
//     private totalMass: number = this.massPole + this.massCart;
//     private length = 0.5; // actually half the pole's length
//     private poleMassLength: number = this.massPole * this.length;
//     private forceMag = 10.0;
//     private tau = 0.02; // seconds between state updates
//     private kinematicsIntegrator = 'euler';
//
//     // Angle at which to fail the episode
//     private thetaThresholdRadians = 12 * 2 * Math.PI / 360;
//     private xThreshold = 2.4;
//     private state?: [number, number, number, number];
//     private stepsBeyondDone?: number;
//     private random?: { next(): number };
//     private viewer?: CartPoleViewer;
//
//     constructor() {
//         super();
//         this.metadata['render.modes'] = ['human', 'rgb_array'];
//         this.metadata['video.frames_per_second'] = 50;
//     }
//
//     reset(args?: { [p: string]: any }): Observation {
//         const random = this.random!;
//         this.state = [random.next(), random.next(), random.next(), random.next()];
//         this.stepsBeyondDone = undefined;
//         return NdArray.array1d(this.state);
//     }
//
//     seed(seed?: number | string): number[] {
//         if (seed === undefined || typeof seed === 'string') {
//             seed = seedrandom.alea(seed).double();
//         }
//         this.random = MersenneTwister19937.seed(seed);
//         return [seed];
//     }
//
//     step(action: number): Step {
//         assert(this.actionSpace?.contains(action), `${action} invalid`);
//         let [x, xDot, theta, thetaDot] = this.state!;
//         const force = action === 1 ? this.forceMag : -this.forceMag;
//         const cosTheta = Math.cos(theta);
//         const sinTheta = Math.sin(theta);
//
//         // For the interested reader:
//         // https://coneural.org/florian/papers/05_cart_pole.pdf
//         const temp = (force + this.poleMassLength * thetaDot ** 2 * sinTheta) / this.totalMass;
//         const thetaAcc = (this.gravity * sinTheta - cosTheta * temp) / (this.length * (4.0 / 3.0 - this.massPole * cosTheta ** 2 / this.totalMass));
//         const xAcc = temp - this.poleMassLength * thetaAcc * cosTheta / this.totalMass;
//         if (this.kinematicsIntegrator === 'euler') {
//             x = x + this.tau * xDot;
//             xDot = xDot + this.tau * xAcc;
//             theta = theta + this.tau * thetaDot;
//             thetaDot = thetaDot + this.tau * thetaAcc;
//         } else { // semi-implicit euler
//             xDot = xDot + this.tau * xAcc;
//             x = x + this.tau * xDot;
//             thetaDot = thetaDot + this.tau * thetaAcc;
//             theta = theta + this.tau * thetaDot;
//         }
//         this.state = [x, xDot, theta, thetaDot];
//
//         const done = x < - this.xThreshold || x > this.xThreshold ||
//             theta < -this.thetaThresholdRadians || theta > this.thetaThresholdRadians;
//
//         let reward!: number;
//         if (!done) {
//             reward = 1.0;
//         } else if (this.stepsBeyondDone === undefined) {
//             this.stepsBeyondDone = 0;
//             reward = 1.0;
//         } else {
//             if (this.stepsBeyondDone === 0) {
//                 // warn
//             }
//             this.stepsBeyondDone += 1;
//             reward = 0.0;
//         }
//
//         return { observation: array1d(this.state), reward, done, info: { } } ;
//     }
//
//     render(mode: RenderMode = 'human', args?: { [p: string]: any }): any {
//         const screenWidth = 600;
//         const screenHeight = 400;
//
//         const worldWidth = this.xThreshold * 2;
//         const scale = screenWidth / worldWidth;
//         const carty = 100; // TOP OF CART
//         const poleWidth = 10.0;
//         const poleLen = scale * (2 * this.length);
//         const cartWidth = 50.0;
//         const cartHeight = 30.0;
//         if (!this.viewer) {
//             // s
//         }
//
//         if (this.state === undefined) {
//             return undefined;
//         }
//         return super.render(mode, args);
//     }
//     close() {
//         if (this.viewer) {
//             this.viewer.close();
//             this.viewer = undefined;
//         }
//         super.close();
//     }
// }
//
// export interface CartPoleViewer {
//     close(): void;
// }
