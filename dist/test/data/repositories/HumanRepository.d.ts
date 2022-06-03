import { Repository } from "../../../src/index";
import { Human } from "../models";
export declare class HumanRepository extends Repository<Human> {
    getModel(): Human;
}
