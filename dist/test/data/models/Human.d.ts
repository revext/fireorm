import { Model } from "../../../src/index";
import { Dog } from '../models';
export declare class Human extends Model {
    name: string;
    relatives: Human[];
    dogs: Dog[];
    createdAt: Date;
}
