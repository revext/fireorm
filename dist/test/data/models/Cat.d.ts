import { Human } from ".";
import { Model } from "../../../src/index";
export declare class Cat extends Model {
    name: string;
    type: string;
    humanId: string;
    human: Human;
}
