import EngineInterface from "~/engine/EngineInterface";
import { RepositoryMap } from "./RepositoryMap";


export type GlobalThisOrm = typeof globalThis & { 
    _engine: EngineInterface;
    _repositoryMapping: RepositoryMap;
}