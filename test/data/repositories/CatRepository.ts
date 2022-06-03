import { Repository } from "../../../src/index";
import { Cat } from "../models";

export class CatRepository extends Repository<Cat>{
    getModel(): Cat {
        return new Cat()
    }
}
