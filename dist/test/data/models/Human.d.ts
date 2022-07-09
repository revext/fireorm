import { Model } from "../../../src/index";
import { Dog } from '../models';
export declare class Human extends Model {
    getModelName(): string;
    name: string;
    relatives: Human[];
    dogs: Dog[];
    createdAt: Date;
}
