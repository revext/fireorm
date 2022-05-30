import { Repository } from "../../../src/index";
import { Dog } from "../models";

export class DogRepository extends Repository<Dog>{
    getModel(): Dog {
        return new Dog()
    }
}
