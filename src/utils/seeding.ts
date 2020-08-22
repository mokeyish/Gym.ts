import { Random, RandomEngineFactory } from '@tszone/ext';



export class Seeding {
    public static random(seed?: number | string): [Random, number] {
        seed = RandomEngineFactory.createSeed(seed);
        const engine = RandomEngineFactory.create(seed);
        const random = new Random(engine);
        return [random, seed];
    }
}


