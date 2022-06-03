import { Repository } from "../../../src/index";
import { Cat } from "../models";
export declare class CatRepository extends Repository<Cat> {
    getModel(): Cat;
}
