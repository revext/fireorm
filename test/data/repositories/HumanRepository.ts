import { Repository } from "../../../src/index";
import { Human } from "../models";

export class HumanRepository extends Repository<Human>{
    getModel(): Human {
        return new Human()
    }
}
