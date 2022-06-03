import { Repository } from "../../../src/index";
import { Dog } from "../models";
export declare class DogRepository extends Repository<Dog> {
    getModel(): Dog;
}
