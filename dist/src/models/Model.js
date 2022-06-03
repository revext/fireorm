"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validatorjs_1 = __importDefault(require("validatorjs"));
const MetadataKeys_1 = require("../decorators/MetadataKeys");
const engine_1 = require("../engine");
const repositories_1 = require("../repositories");
const Blueprint_1 = require("./Blueprint");
const __1 = require("..");
const class_transformer_1 = require("class-transformer");
class Model {
    constructor(...params) {
        this.id = null;
        this.relationsLoaded = [];
        this.errors = null;
        this.init(params);
    }
    init(_) { return; }
    collectRules() {
        var _a;
        let rules = {};
        for (const propertyKey in this) {
            //TODO recursive validation on related models
            if (Reflect.hasMetadata(MetadataKeys_1.validateMetadataKey, this, propertyKey)) {
                const rule = (_a = Reflect.getMetadata(MetadataKeys_1.validateMetadataKey, this, propertyKey)) !== null && _a !== void 0 ? _a : {};
                if (rule instanceof Function) {
                    rules = Object.assign(rules, rule(this));
                }
                else if (rule instanceof Object) {
                    rules = Object.assign(rules, rule);
                }
                else {
                    rules[propertyKey] = rule;
                }
            }
        }
        return rules;
    }
    validate() {
        return new Promise((resolve, reject) => {
            const rules = this.collectRules();
            let validator = new validatorjs_1.default(this, rules);
            if (validator.hasAsync) {
                validator.checkAsync(resolve, () => {
                    this.errors = validator.errors;
                    reject();
                });
            }
            else {
                if (validator.check()) {
                    resolve();
                }
                else {
                    this.errors = validator.errors;
                    reject();
                }
            }
        });
    }
    hasErrors() {
        var _a;
        return Object.keys((_a = this.errors) !== null && _a !== void 0 ? _a : {}).length > 0;
    }
    getAllErrors() {
        var _a;
        return (_a = this.errors) === null || _a === void 0 ? void 0 : _a.all();
    }
    getErrors(name) {
        var _a;
        return (_a = this.errors) === null || _a === void 0 ? void 0 : _a.get(name);
    }
    getError(name) {
        var _a;
        return (_a = this.errors) === null || _a === void 0 ? void 0 : _a.first(name);
    }
    async loadMany(relationNames) {
        const promises = [];
        for (const relation in relationNames) {
            promises.push(this.load(relationNames[relation]));
        }
        await Promise.all(promises);
    }
    async load(relationName) {
        var _a;
        let found = false;
        const anyThis = this;
        const relations = relationName.split('.');
        relationName = relations.reverse().pop();
        let loadedProperty = relationName;
        if (!this.relationsLoaded.includes(relationName)) {
            const routeParams = this.getRouteParameterMapping();
            for (const propertyKey in this) {
                if (Reflect.hasMetadata(MetadataKeys_1.relationMetadataKey, this, propertyKey)) {
                    const options = (_a = Reflect.getMetadata(MetadataKeys_1.relationMetadataKey, this, propertyKey)) !== null && _a !== void 0 ? _a : {};
                    //get the repository for the current modelClass
                    const repository = (0, repositories_1.getRepositoryFor)(options.modelClass);
                    if ((options.name && options.name === relationName) || propertyKey === relationName) {
                        loadedProperty = propertyKey;
                        found = true;
                        if (options.type === 'hasMany') {
                            const hasManyOptions = options;
                            if (!hasManyOptions.mapIds && !hasManyOptions.relatedIds) {
                                throw new Error(`@HasMany relation ${relationName} on ${this.constructor.name} is missing 'mapIds' and 'relatedIds'. One of them must be defined.`);
                            }
                            if (anyThis[propertyKey] instanceof Array || anyThis[propertyKey] === undefined || anyThis[propertyKey] === null) {
                                anyThis[propertyKey] = await repository.loadMany((hasManyOptions.mapIds ? hasManyOptions.mapIds(this) : anyThis[hasManyOptions.relatedIds]), routeParams);
                                if (options.foreignProperty) {
                                    for (const index in anyThis[propertyKey]) {
                                        anyThis[propertyKey][index][options.foreignProperty] = this;
                                    }
                                }
                            }
                            else {
                                throw new Error(`Relation ${relationName} with '${options.type}' on ${options.relatedId} property is not an array`);
                            }
                        }
                        else if (options.type === 'hasCollection') {
                            //TODO an option where the related data can be 'paginated'
                            //check if property is array, then load the subcollection into it
                            if (anyThis[propertyKey] instanceof Array || anyThis[propertyKey] === undefined || anyThis[propertyKey] === null) {
                                anyThis[propertyKey] = await repository.loadCollection(routeParams);
                                if (options.foreignProperty) {
                                    for (const index in anyThis[propertyKey]) {
                                        anyThis[propertyKey][index][options.foreignProperty] = this;
                                    }
                                }
                            }
                            else {
                                throw new Error(`Relation ${relationName} with '${options.type}' on ${propertyKey} property is not an array`);
                            }
                        }
                        else {
                            //load data into the 'propertyKey' property of the model, while load the model with the id from the 'relatedId' property
                            anyThis[propertyKey] = await repository.load(this[options.relatedId], routeParams);
                            if (options.foreignProperty) {
                                anyThis[propertyKey][options.foreignProperty] = this;
                            }
                        }
                    }
                }
            }
            if (!found) {
                throw new Error(`Relation ${relationName} not found on ${this.constructor.name}`);
            }
            this.relationsLoaded.push(relationName);
        }
        if (relations.length > 0) {
            await anyThis[loadedProperty].load(relations.reverse().join('.'));
        }
    }
    getBlueprint() {
        return new Blueprint_1.Blueprint(this, this.getRouteParameterMapping());
    }
    getRoute() {
        var _a;
        const options = (_a = Reflect.getMetadata(MetadataKeys_1.collectionMetadataKey, this.constructor)) !== null && _a !== void 0 ? _a : {};
        if (!options || !options.route) {
            throw new Error(`Class ${this.constructor.name} doesn't have a route parameter on the @Collection annotation`);
        }
        return options.route;
    }
    getRouteParameterMapping() {
        var _a, _b, _c;
        const searchRegex = /{([^}]+)}/g;
        if (Reflect.hasMetadata(MetadataKeys_1.collectionMetadataKey, this.constructor)) {
            const options = (_a = Reflect.getMetadata(MetadataKeys_1.collectionMetadataKey, this.constructor)) !== null && _a !== void 0 ? _a : {};
            if (!options || !options.route) {
                throw new Error(`Class ${this.constructor.name} doesn't have a route parameter on the @Collection annotation`);
            }
            const pathTemplate = options.route;
            const params = searchRegex.exec(pathTemplate);
            const returnParams = [];
            //if has route param
            if (params) {
                //check to see if route param is a property of the model and it is set
                params.forEach((param) => {
                    const paramStrip = param.replace(/[{}]/g, '');
                    if (!this[paramStrip]) {
                        throw new Error(`Required route param ${paramStrip} is not set on the class ${this.constructor.name}`);
                    }
                    if (!returnParams.includes(paramStrip))
                        returnParams.push(paramStrip);
                });
            }
            //get every param which has been annotated in the model with 'routeParam: true'
            const paramsObject = {};
            for (const propertyKey in this) {
                if (Reflect.hasMetadata(MetadataKeys_1.fieldMetadataKey, this, propertyKey)) {
                    const options = (_b = Reflect.getMetadata(MetadataKeys_1.fieldMetadataKey, this, propertyKey)) !== null && _b !== void 0 ? _b : {};
                    if (options.routeParam) {
                        paramsObject[(_c = options.name) !== null && _c !== void 0 ? _c : propertyKey] = this[propertyKey];
                    }
                }
            }
            return paramsObject;
        }
        else {
            throw new Error(`Class ${this.constructor.name} is not annotated with @Collection`);
        }
    }
    toJson() {
        var _a, _b;
        const json = {};
        for (const propertyKey in this) {
            // if property has field metadata, then we must convert into json
            if (Reflect.hasMetadata(MetadataKeys_1.fieldMetadataKey, this, propertyKey)) {
                console.log(this.constructor.name, propertyKey);
                const options = ((_a = Reflect.getMetadata(MetadataKeys_1.fieldMetadataKey, this, propertyKey)) !== null && _a !== void 0 ? _a : {});
                const jsonPropertyKey = (_b = options.name) !== null && _b !== void 0 ? _b : propertyKey;
                if (this[propertyKey] !== undefined) {
                    if (this[propertyKey] instanceof Model) {
                        // console.log(this.constructor.name, propertyKey, "is a model")
                        // if the property is a model, then we must convert into json
                        json[jsonPropertyKey] = this[propertyKey].toJson();
                    }
                    else {
                        //if property is an array or object then iterate over its properties, and convert into json recursively
                        if (this[propertyKey] instanceof Array) {
                            // console.log(this.constructor.name, propertyKey, "is an array")
                            json[jsonPropertyKey] = this.convertToJson(this[propertyKey]);
                        }
                        else if (this[propertyKey] instanceof Object) {
                            // console.log(this.constructor.name, propertyKey, "is an object")
                            json[jsonPropertyKey] = (0, class_transformer_1.instanceToPlain)(this[propertyKey], { enableCircularCheck: true });
                            // json[jsonPropertyKey] = this[propertyKey]
                        }
                        else {
                            // console.log(this.constructor.name, propertyKey, "is other")
                            //otherwise property is just a property, so we convert it based on its type or decorator
                            if (options.timestamp) {
                                json[jsonPropertyKey] = (0, engine_1.useEngine)().convertToTimestamp(this[propertyKey]);
                            }
                            else {
                                json[jsonPropertyKey] = this[propertyKey];
                            }
                        }
                    }
                }
                else {
                    json[jsonPropertyKey] = null;
                }
            }
        }
        json.id = this.id;
        return json;
    }
    convertToJson(root) {
        const json = root instanceof Array ? [] : {};
        Object.keys(root).forEach((key) => {
            if (root[key] !== undefined)
                if (root[key] instanceof Model) {
                    json[key] = root[key].toJson();
                }
                else {
                    if (root[key] instanceof Array || root[key] instanceof Object) {
                        json[key] = this.convertToJson(root[key]);
                    }
                    else {
                        json[key] = root[key];
                    }
                }
        });
        return json;
    }
    fromJson(data) {
        var _a, _b;
        let anyThis = this;
        for (const propertyKey in data) {
            //if property exists in data and property has field metadata, then we must convert from json
            if (Reflect.hasMetadata(MetadataKeys_1.fieldMetadataKey, this, propertyKey)) {
                const options = (_a = Reflect.getMetadata(MetadataKeys_1.fieldMetadataKey, this, propertyKey)) !== null && _a !== void 0 ? _a : {};
                const jsonPropertyKey = (_b = options.name) !== null && _b !== void 0 ? _b : propertyKey;
                if (data[jsonPropertyKey]) {
                    if (options === null || options === void 0 ? void 0 : options.modelClass) {
                        if (data[jsonPropertyKey] instanceof Array) {
                            anyThis[jsonPropertyKey] = new Array();
                            data[jsonPropertyKey].forEach((value) => {
                                if (options.modelClass.prototype instanceof Model) {
                                    anyThis[jsonPropertyKey].push((new options.modelClass()).fromJson(value));
                                }
                                else {
                                    anyThis[jsonPropertyKey] = (0, class_transformer_1.plainToInstance)(options.modelClass, value, { enableCircularCheck: true });
                                }
                            });
                        }
                        else {
                            if (options.modelClass.prototype instanceof Model) {
                                anyThis[jsonPropertyKey].push((new options.modelClass()).fromJson(data[jsonPropertyKey]));
                            }
                            else {
                                anyThis[jsonPropertyKey] = (0, class_transformer_1.plainToInstance)(options.modelClass, data[jsonPropertyKey], { enableCircularCheck: true });
                            }
                        }
                    }
                    else {
                        // if property is an array or object then iterate over its properties, and convert from json recursively
                        if (data[jsonPropertyKey] instanceof Object || data[jsonPropertyKey] instanceof Array) {
                            anyThis[propertyKey] = this.convertFromJson(data[jsonPropertyKey]);
                        }
                        else {
                            //otherwise property is just a property, so we convert it based on its type or decorator
                            if (options.timestamp) {
                                anyThis[propertyKey] = (0, engine_1.useEngine)().convertFromTimestamp(data[jsonPropertyKey]);
                            }
                            else {
                                anyThis[propertyKey] = data[jsonPropertyKey];
                            }
                        }
                    }
                }
            }
        }
        this.id = data.id;
        return this;
    }
    convertFromJson(root) {
        const json = root instanceof Array ? [] : {};
        Object.keys(root).forEach((key) => {
            if (root[key] instanceof Array || root[key] instanceof Object)
                json[key] = this.convertFromJson(root[key]);
            else
                json[key] = root[key];
        });
        return json;
    }
}
__decorate([
    (0, __1.Field)(),
    __metadata("design:type", String)
], Model.prototype, "id", void 0);
exports.default = Model;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbW9kZWxzL01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsOERBQStDO0FBRS9DLDZEQUErSDtBQUMvSCxzQ0FBc0M7QUFDdEMsa0RBQW1EO0FBS25ELDJDQUF3QztBQUN4QywwQkFBMkI7QUFDM0IseURBQXFFO0FBTXJFLE1BQThCLEtBQUs7SUFNL0IsWUFBWSxHQUFHLE1BQWE7UUFKNUIsT0FBRSxHQUFZLElBQUksQ0FBQTtRQUVsQixvQkFBZSxHQUFhLEVBQUUsQ0FBQTtRQVF0QixXQUFNLEdBQVcsSUFBSSxDQUFBO1FBTDNCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDbkIsQ0FBQztJQUVELElBQUksQ0FBQyxDQUFRLElBQVUsT0FBTSxDQUFDLENBQUM7SUFJdkIsWUFBWTs7UUFFbEIsSUFBSSxLQUFLLEdBQW9CLEVBQUUsQ0FBQTtRQUMvQixLQUFJLE1BQU0sV0FBVyxJQUFJLElBQUksRUFBQztZQUM1Qiw2Q0FBNkM7WUFDN0MsSUFBRyxPQUFPLENBQUMsV0FBVyxDQUFDLGtDQUFtQixFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsRUFBQztnQkFDN0QsTUFBTSxJQUFJLEdBQUcsTUFBQSxPQUFPLENBQUMsV0FBVyxDQUFDLGtDQUFtQixFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsbUNBQUksRUFBdUIsQ0FBQTtnQkFFbkcsSUFBRyxJQUFJLFlBQVksUUFBUSxFQUFDO29CQUMxQixLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7aUJBQ3pDO3FCQUFNLElBQUcsSUFBSSxZQUFZLE1BQU0sRUFBQztvQkFDL0IsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFBO2lCQUNuQztx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QUNKO0FBalVHO0lBREMsSUFBQSxTQUFLLEdBQUU7O2lDQUNVO0FBRnRCLHdCQW1VQyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5pbXBvcnQgVmFsaWRhdG9yLCB7IEVycm9ycyB9IGZyb20gXCJ2YWxpZGF0b3Jqc1wiXHJcbmltcG9ydCBSZXBvc2l0b3J5IGZyb20gXCJ+L3JlcG9zaXRvcmllcy9SZXBvc2l0b3J5XCI7XHJcbmltcG9ydCB7IGNvbGxlY3Rpb25NZXRhZGF0YUtleSwgZmllbGRNZXRhZGF0YUtleSwgcmVsYXRpb25NZXRhZGF0YUtleSwgdmFsaWRhdGVNZXRhZGF0YUtleSB9IGZyb20gXCIuLi9kZWNvcmF0b3JzL01ldGFkYXRhS2V5c1wiO1xyXG5pbXBvcnQgeyB1c2VFbmdpbmUgfSBmcm9tIFwiLi4vZW5naW5lXCI7XHJcbmltcG9ydCB7IGdldFJlcG9zaXRvcnlGb3IgfSBmcm9tIFwiLi4vcmVwb3NpdG9yaWVzXCI7XHJcbmltcG9ydCB7IEhhc01hbnlSZWxhdGlvbkNvbmZpZywgUmVsYXRpb25Db25maWdXaXRoVHlwZSB9IGZyb20gXCIuLi90eXBlcy9jb25maWdzL1JlbGF0aW9uQ29uZmlnXCI7XHJcbmltcG9ydCB7IENvbnN0cnVjdG9yRnVuY3Rpb24gfSBmcm9tIFwiLi4vdHlwZXMvZnVuY3Rpb25zL0NvbnN0cnVjdG9yRnVuY3Rpb25cIjtcclxuaW1wb3J0IHsgRmllbGRDb25maWcgfSBmcm9tIFwiLi4vdHlwZXMvY29uZmlncy9GaWVsZENvbmZpZ1wiO1xyXG5pbXBvcnQgeyBWYWxpZGF0ZUNvbmZpZyB9IGZyb20gXCIuLi90eXBlcy9jb25maWdzL1ZhbGlkYXRlQ29uZmlnXCI7XHJcbmltcG9ydCB7IEJsdWVwcmludCB9IGZyb20gXCIuL0JsdWVwcmludFwiO1xyXG5pbXBvcnQgeyBGaWVsZCB9IGZyb20gXCIuLlwiO1xyXG5pbXBvcnQgeyBpbnN0YW5jZVRvUGxhaW4sIHBsYWluVG9JbnN0YW5jZSB9IGZyb20gXCJjbGFzcy10cmFuc2Zvcm1lclwiO1xyXG5cclxuXHJcbmV4cG9ydCB0eXBlIFBhcmFtc09iamVjdCA9IHsgW2tleTogc3RyaW5nXTogYW55IH07XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgYWJzdHJhY3QgY2xhc3MgTW9kZWwge1xyXG4gICAgQEZpZWxkKClcclxuICAgIGlkPzogc3RyaW5nID0gbnVsbFxyXG5cclxuICAgIHJlbGF0aW9uc0xvYWRlZDogc3RyaW5nW10gPSBbXVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKC4uLnBhcmFtczogYW55W10pIHtcclxuICAgICAgdGhpcy5pbml0KHBhcmFtcylcclxuICAgIH1cclxuXHJcbiAgICBpbml0KF86IGFueVtdKTogdm9pZCB7IHJldHVybiB9XHJcblxyXG4gICAgcHJpdmF0ZSBlcnJvcnM6IEVycm9ycyA9IG51bGxcclxuXHJcbiAgICBwcml2YXRlIGNvbGxlY3RSdWxlczxUPigpOiBWYWxpZGF0b3IuUnVsZXMge1xyXG4gICAgICBcclxuICAgICAgbGV0IHJ1bGVzOiBWYWxpZGF0b3IuUnVsZXMgPSB7fVxyXG4gICAgICBmb3IoY29uc3QgcHJvcGVydHlLZXkgaW4gdGhpcyl7XHJcbiAgICAgICAgLy9UT0RPIHJlY3Vyc2l2ZSB2YWxpZGF0aW9uIG9uIHJlbGF0ZWQgbW9kZWxzXHJcbiAgICAgICAgaWYoUmVmbGVjdC5oYXNNZXRhZGF0YSh2YWxpZGF0ZU1ldGFkYXRhS2V5LCB0aGlzLCBwcm9wZXJ0eUtleSkpe1xyXG4gICAgICAgICAgY29uc3QgcnVsZSA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEodmFsaWRhdGVNZXRhZGF0YUtleSwgdGhpcywgcHJvcGVydHlLZXkpID8/IHt9IGFzIFZhbGlkYXRlQ29uZmlnPFQ+XHJcblxyXG4gICAgICAgICAgaWYocnVsZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKXtcclxuICAgICAgICAgICAgcnVsZXMgPSBPYmplY3QuYXNzaWduKHJ1bGVzLCBydWxlKHRoaXMpKVxyXG4gICAgICAgICAgfSBlbHNlIGlmKHJ1bGUgaW5zdGFuY2VvZiBPYmplY3Qpe1xyXG4gICAgICAgICAgICBydWxlcyA9IE9iamVjdC5hc3NpZ24ocnVsZXMsIHJ1bGUpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBydWxlc1twcm9wZXJ0eUtleV0gPSBydWxlXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBydWxlc1xyXG4gICAgfVxyXG5cclxuICAgIHZhbGlkYXRlICgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBjb25zdCBydWxlcyA9IHRoaXMuY29sbGVjdFJ1bGVzKClcclxuICAgICAgICBsZXQgdmFsaWRhdG9yID0gbmV3IFZhbGlkYXRvcih0aGlzIGFzIGFueSwgcnVsZXMpXHJcblxyXG4gICAgICAgIGlmICh2YWxpZGF0b3IuaGFzQXN5bmMpIHtcclxuICAgICAgICAgIHZhbGlkYXRvci5jaGVja0FzeW5jKHJlc29sdmUsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5lcnJvcnMgPSB2YWxpZGF0b3IuZXJyb3JzXHJcbiAgICAgICAgICAgIHJlamVjdCgpXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAodmFsaWRhdG9yLmNoZWNrKCkpIHtcclxuICAgICAgICAgICAgcmVzb2x2ZSgpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmVycm9ycyA9IHZhbGlkYXRvci5lcnJvcnNcclxuICAgICAgICAgICAgcmVqZWN0KClcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgaGFzRXJyb3JzICgpOiBib29sZWFuIHtcclxuICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuZXJyb3JzID8/IHt9KS5sZW5ndGggPiAwXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QWxsRXJyb3JzICgpOiBWYWxpZGF0b3IuVmFsaWRhdGlvbkVycm9ycyB7XHJcbiAgICAgIHJldHVybiB0aGlzLmVycm9ycz8uYWxsKClcclxuICAgIH1cclxuXHJcbiAgICBnZXRFcnJvcnMgKG5hbWU6IHN0cmluZyk6IEFycmF5PHN0cmluZz4gfCBmYWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmVycm9ycz8uZ2V0KG5hbWUpXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RXJyb3IgKG5hbWU6IHN0cmluZyk6IHN0cmluZyB8IGZhbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZXJyb3JzPy5maXJzdChuYW1lKVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGxvYWRNYW55KHJlbGF0aW9uTmFtZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPntcclxuICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXVxyXG4gICAgICBmb3IoY29uc3QgcmVsYXRpb24gaW4gcmVsYXRpb25OYW1lcyl7XHJcbiAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLmxvYWQocmVsYXRpb25OYW1lc1tyZWxhdGlvbl0pKVxyXG4gICAgICB9XHJcbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGxvYWQocmVsYXRpb25OYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgbGV0IGZvdW5kID0gZmFsc2VcclxuICAgICAgY29uc3QgYW55VGhpcyA9IHRoaXMgYXMgYW55XHJcblxyXG4gICAgICBjb25zdCByZWxhdGlvbnMgPSByZWxhdGlvbk5hbWUuc3BsaXQoJy4nKVxyXG4gICAgICByZWxhdGlvbk5hbWUgPSByZWxhdGlvbnMucmV2ZXJzZSgpLnBvcCgpXHJcblxyXG4gICAgICBsZXQgbG9hZGVkUHJvcGVydHkgPSByZWxhdGlvbk5hbWVcclxuICAgICAgXHJcbiAgICAgIGlmKCF0aGlzLnJlbGF0aW9uc0xvYWRlZC5pbmNsdWRlcyhyZWxhdGlvbk5hbWUpKXtcclxuICAgICAgICBjb25zdCByb3V0ZVBhcmFtcyA9IHRoaXMuZ2V0Um91dGVQYXJhbWV0ZXJNYXBwaW5nKClcclxuICAgICAgICBmb3IoY29uc3QgcHJvcGVydHlLZXkgaW4gdGhpcykge1xyXG4gICAgICAgICAgaWYoUmVmbGVjdC5oYXNNZXRhZGF0YShyZWxhdGlvbk1ldGFkYXRhS2V5LCB0aGlzLCBwcm9wZXJ0eUtleSkpe1xyXG4gICAgICAgICAgICBjb25zdCBvcHRpb25zID0gUmVmbGVjdC5nZXRNZXRhZGF0YShyZWxhdGlvbk1ldGFkYXRhS2V5LCB0aGlzLCBwcm9wZXJ0eUtleSkgPz8ge30gYXMgUmVsYXRpb25Db25maWdXaXRoVHlwZVxyXG4gICAgICAgICAgICAvL2dldCB0aGUgcmVwb3NpdG9yeSBmb3IgdGhlIGN1cnJlbnQgbW9kZWxDbGFzc1xyXG4gICAgICAgICAgICBjb25zdCByZXBvc2l0b3J5ID0gZ2V0UmVwb3NpdG9yeUZvcihvcHRpb25zLm1vZGVsQ2xhc3MgYXMgQ29uc3RydWN0b3JGdW5jdGlvbjxNb2RlbD4pIGFzIFJlcG9zaXRvcnk8TW9kZWw+XHJcbiAgICAgICAgICAgIGlmKChvcHRpb25zLm5hbWUgJiYgb3B0aW9ucy5uYW1lID09PSByZWxhdGlvbk5hbWUpIHx8IHByb3BlcnR5S2V5ID09PSByZWxhdGlvbk5hbWUpIHtcclxuICAgICAgICAgICAgICBsb2FkZWRQcm9wZXJ0eSA9IHByb3BlcnR5S2V5XHJcbiAgICAgICAgICAgICAgZm91bmQgPSB0cnVlXHJcbiAgICAgICAgICAgICAgaWYob3B0aW9ucy50eXBlID09PSAnaGFzTWFueScpe1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaGFzTWFueU9wdGlvbnMgPSBvcHRpb25zIGFzIEhhc01hbnlSZWxhdGlvbkNvbmZpZ1xyXG4gICAgICAgICAgICAgICAgaWYoIWhhc01hbnlPcHRpb25zLm1hcElkcyAmJiAhaGFzTWFueU9wdGlvbnMucmVsYXRlZElkcyl7XHJcbiAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQEhhc01hbnkgcmVsYXRpb24gJHtyZWxhdGlvbk5hbWV9IG9uICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBpcyBtaXNzaW5nICdtYXBJZHMnIGFuZCAncmVsYXRlZElkcycuIE9uZSBvZiB0aGVtIG11c3QgYmUgZGVmaW5lZC5gKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoYW55VGhpc1twcm9wZXJ0eUtleV0gaW5zdGFuY2VvZiBBcnJheSB8fCBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9PT0gdW5kZWZpbmVkIHx8IGFueVRoaXNbcHJvcGVydHlLZXldID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gYXdhaXQgcmVwb3NpdG9yeS5sb2FkTWFueSgoaGFzTWFueU9wdGlvbnMubWFwSWRzID8gaGFzTWFueU9wdGlvbnMubWFwSWRzKHRoaXMpIDogYW55VGhpc1toYXNNYW55T3B0aW9ucy5yZWxhdGVkSWRzXSksIHJvdXRlUGFyYW1zKVxyXG4gICAgICAgICAgICAgICAgICBpZihvcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eSl7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yKGNvbnN0IGluZGV4IGluIGFueVRoaXNbcHJvcGVydHlLZXldKXtcclxuICAgICAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldW2luZGV4XVtvcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eV0gPSB0aGlzXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFJlbGF0aW9uICR7cmVsYXRpb25OYW1lfSB3aXRoICcke29wdGlvbnMudHlwZX0nIG9uICR7b3B0aW9ucy5yZWxhdGVkSWR9IHByb3BlcnR5IGlzIG5vdCBhbiBhcnJheWApXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmKG9wdGlvbnMudHlwZSA9PT0gJ2hhc0NvbGxlY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAvL1RPRE8gYW4gb3B0aW9uIHdoZXJlIHRoZSByZWxhdGVkIGRhdGEgY2FuIGJlICdwYWdpbmF0ZWQnXHJcbiAgICAgICAgICAgICAgICAvL2NoZWNrIGlmIHByb3BlcnR5IGlzIGFycmF5LCB0aGVuIGxvYWQgdGhlIHN1YmNvbGxlY3Rpb24gaW50byBpdFxyXG4gICAgICAgICAgICAgICAgaWYoYW55VGhpc1twcm9wZXJ0eUtleV0gaW5zdGFuY2VvZiBBcnJheSB8fCBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9PT0gdW5kZWZpbmVkIHx8IGFueVRoaXNbcHJvcGVydHlLZXldID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gYXdhaXQgcmVwb3NpdG9yeS5sb2FkQ29sbGVjdGlvbihyb3V0ZVBhcmFtcylcclxuICAgICAgICAgICAgICAgICAgaWYob3B0aW9ucy5mb3JlaWduUHJvcGVydHkpe1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcihjb25zdCBpbmRleCBpbiBhbnlUaGlzW3Byb3BlcnR5S2V5XSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XVtpbmRleF1bb3B0aW9ucy5mb3JlaWduUHJvcGVydHldID0gdGhpc1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZWxhdGlvbiAke3JlbGF0aW9uTmFtZX0gd2l0aCAnJHtvcHRpb25zLnR5cGV9JyBvbiAke3Byb3BlcnR5S2V5fSBwcm9wZXJ0eSBpcyBub3QgYW4gYXJyYXlgKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvL2xvYWQgZGF0YSBpbnRvIHRoZSAncHJvcGVydHlLZXknIHByb3BlcnR5IG9mIHRoZSBtb2RlbCwgd2hpbGUgbG9hZCB0aGUgbW9kZWwgd2l0aCB0aGUgaWQgZnJvbSB0aGUgJ3JlbGF0ZWRJZCcgcHJvcGVydHlcclxuICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gYXdhaXQgcmVwb3NpdG9yeS5sb2FkKCh0aGlzIGFzIGFueSlbb3B0aW9ucy5yZWxhdGVkSWRdLCByb3V0ZVBhcmFtcylcclxuICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMuZm9yZWlnblByb3BlcnR5KXtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV1bb3B0aW9ucy5mb3JlaWduUHJvcGVydHldID0gdGhpc1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgXHJcbiAgICAgICAgaWYoIWZvdW5kKXtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUmVsYXRpb24gJHtyZWxhdGlvbk5hbWV9IG5vdCBmb3VuZCBvbiAke3RoaXMuY29uc3RydWN0b3IubmFtZX1gKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnJlbGF0aW9uc0xvYWRlZC5wdXNoKHJlbGF0aW9uTmFtZSlcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYocmVsYXRpb25zLmxlbmd0aCA+IDApe1xyXG4gICAgICAgIGF3YWl0IGFueVRoaXNbbG9hZGVkUHJvcGVydHldLmxvYWQocmVsYXRpb25zLnJldmVyc2UoKS5qb2luKCcuJykpXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRCbHVlcHJpbnQ8VCBleHRlbmRzIE1vZGVsPih0aGlzOiBUKTogQmx1ZXByaW50PFQ+IHtcclxuICAgICAgcmV0dXJuIG5ldyBCbHVlcHJpbnQodGhpcywgdGhpcy5nZXRSb3V0ZVBhcmFtZXRlck1hcHBpbmcoKSlcclxuICAgIH1cclxuXHJcbiAgICBnZXRSb3V0ZSgpOiBzdHJpbmcge1xyXG4gICAgICBjb25zdCBvcHRpb25zID0gUmVmbGVjdC5nZXRNZXRhZGF0YShjb2xsZWN0aW9uTWV0YWRhdGFLZXksIHRoaXMuY29uc3RydWN0b3IpID8/IHt9XHJcbiAgICAgIGlmKCFvcHRpb25zIHx8ICFvcHRpb25zLnJvdXRlKXtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBkb2Vzbid0IGhhdmUgYSByb3V0ZSBwYXJhbWV0ZXIgb24gdGhlIEBDb2xsZWN0aW9uIGFubm90YXRpb25gKVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBvcHRpb25zLnJvdXRlXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Um91dGVQYXJhbWV0ZXJNYXBwaW5nKCk6IFBhcmFtc09iamVjdCB7XHJcbiAgICAgIGNvbnN0IHNlYXJjaFJlZ2V4ID0gL3soW159XSspfS9nXHJcbiAgICAgIGlmKFJlZmxlY3QuaGFzTWV0YWRhdGEoY29sbGVjdGlvbk1ldGFkYXRhS2V5LCB0aGlzLmNvbnN0cnVjdG9yKSkge1xyXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKGNvbGxlY3Rpb25NZXRhZGF0YUtleSwgdGhpcy5jb25zdHJ1Y3RvcikgPz8ge31cclxuICAgICAgICBpZighb3B0aW9ucyB8fCAhb3B0aW9ucy5yb3V0ZSl7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBkb2Vzbid0IGhhdmUgYSByb3V0ZSBwYXJhbWV0ZXIgb24gdGhlIEBDb2xsZWN0aW9uIGFubm90YXRpb25gKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcGF0aFRlbXBsYXRlID0gb3B0aW9ucy5yb3V0ZVxyXG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IHNlYXJjaFJlZ2V4LmV4ZWMocGF0aFRlbXBsYXRlKVxyXG5cclxuICAgICAgICBjb25zdCByZXR1cm5QYXJhbXM6IHN0cmluZ1tdID0gW11cclxuICAgICAgICAvL2lmIGhhcyByb3V0ZSBwYXJhbVxyXG4gICAgICAgIGlmKHBhcmFtcyl7XHJcbiAgICAgICAgICAvL2NoZWNrIHRvIHNlZSBpZiByb3V0ZSBwYXJhbSBpcyBhIHByb3BlcnR5IG9mIHRoZSBtb2RlbCBhbmQgaXQgaXMgc2V0XHJcbiAgICAgICAgICBwYXJhbXMuZm9yRWFjaCgocGFyYW0pID0+IHtcclxuICAgICAgICAgICAgY29uc3QgcGFyYW1TdHJpcCA9IHBhcmFtLnJlcGxhY2UoL1t7fV0vZywgJycpXHJcbiAgICAgICAgICAgIGlmKCEodGhpcyBhcyBhbnkpW3BhcmFtU3RyaXBdKXtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFJlcXVpcmVkIHJvdXRlIHBhcmFtICR7cGFyYW1TdHJpcH0gaXMgbm90IHNldCBvbiB0aGUgY2xhc3MgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9YClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZighcmV0dXJuUGFyYW1zLmluY2x1ZGVzKHBhcmFtU3RyaXApKSByZXR1cm5QYXJhbXMucHVzaChwYXJhbVN0cmlwKVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vZ2V0IGV2ZXJ5IHBhcmFtIHdoaWNoIGhhcyBiZWVuIGFubm90YXRlZCBpbiB0aGUgbW9kZWwgd2l0aCAncm91dGVQYXJhbTogdHJ1ZSdcclxuICAgICAgICBjb25zdCBwYXJhbXNPYmplY3Q6IFBhcmFtc09iamVjdCA9IHt9XHJcbiAgICAgICAgZm9yKGNvbnN0IHByb3BlcnR5S2V5IGluIHRoaXMpIHtcclxuICAgICAgICAgIGlmKFJlZmxlY3QuaGFzTWV0YWRhdGEoZmllbGRNZXRhZGF0YUtleSwgdGhpcywgcHJvcGVydHlLZXkpKXtcclxuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoZmllbGRNZXRhZGF0YUtleSwgdGhpcywgcHJvcGVydHlLZXkpID8/IHt9IGFzIEZpZWxkQ29uZmlnXHJcblxyXG4gICAgICAgICAgICBpZihvcHRpb25zLnJvdXRlUGFyYW0pe1xyXG4gICAgICAgICAgICAgIHBhcmFtc09iamVjdFtvcHRpb25zLm5hbWUgPz8gcHJvcGVydHlLZXldID0gdGhpc1twcm9wZXJ0eUtleV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcGFyYW1zT2JqZWN0XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2xhc3MgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9IGlzIG5vdCBhbm5vdGF0ZWQgd2l0aCBAQ29sbGVjdGlvbmApXHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgdG9Kc29uKCk6IGFueSB7XHJcbiAgICAgIGNvbnN0IGpzb246IGFueSA9IHt9XHJcblxyXG4gICAgICBmb3IoY29uc3QgcHJvcGVydHlLZXkgaW4gdGhpcykge1xyXG4gICAgICAgIC8vIGlmIHByb3BlcnR5IGhhcyBmaWVsZCBtZXRhZGF0YSwgdGhlbiB3ZSBtdXN0IGNvbnZlcnQgaW50byBqc29uXHJcbiAgICAgICAgaWYoUmVmbGVjdC5oYXNNZXRhZGF0YShmaWVsZE1ldGFkYXRhS2V5LCB0aGlzLCBwcm9wZXJ0eUtleSkpe1xyXG4gICAgICAgICAgY29uc29sZS5sb2codGhpcy5jb25zdHJ1Y3Rvci5uYW1lLCBwcm9wZXJ0eUtleSlcclxuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSAoUmVmbGVjdC5nZXRNZXRhZGF0YShmaWVsZE1ldGFkYXRhS2V5LCB0aGlzLCBwcm9wZXJ0eUtleSkgPz8ge30pIGFzIEZpZWxkQ29uZmlnXHJcbiAgICAgICAgICBjb25zdCBqc29uUHJvcGVydHlLZXkgPSBvcHRpb25zLm5hbWUgPz8gcHJvcGVydHlLZXlcclxuICAgICAgICAgIGlmKHRoaXNbcHJvcGVydHlLZXldICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICBpZih0aGlzW3Byb3BlcnR5S2V5XSBpbnN0YW5jZW9mIE1vZGVsKSB7XHJcbiAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5jb25zdHJ1Y3Rvci5uYW1lLCBwcm9wZXJ0eUtleSwgXCJpcyBhIG1vZGVsXCIpXHJcbiAgICAgICAgICAgICAgLy8gaWYgdGhlIHByb3BlcnR5IGlzIGEgbW9kZWwsIHRoZW4gd2UgbXVzdCBjb252ZXJ0IGludG8ganNvblxyXG4gICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9ICh0aGlzW3Byb3BlcnR5S2V5XSBhcyB1bmtub3duIGFzIE1vZGVsKS50b0pzb24oKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIC8vaWYgcHJvcGVydHkgaXMgYW4gYXJyYXkgb3Igb2JqZWN0IHRoZW4gaXRlcmF0ZSBvdmVyIGl0cyBwcm9wZXJ0aWVzLCBhbmQgY29udmVydCBpbnRvIGpzb24gcmVjdXJzaXZlbHlcclxuICAgICAgICAgICAgICBpZih0aGlzW3Byb3BlcnR5S2V5XSBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmNvbnN0cnVjdG9yLm5hbWUsIHByb3BlcnR5S2V5LCBcImlzIGFuIGFycmF5XCIpXHJcbiAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSB0aGlzLmNvbnZlcnRUb0pzb24odGhpc1twcm9wZXJ0eUtleV0pXHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmKHRoaXNbcHJvcGVydHlLZXldIGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmNvbnN0cnVjdG9yLm5hbWUsIHByb3BlcnR5S2V5LCBcImlzIGFuIG9iamVjdFwiKVxyXG4gICAgICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldID0gaW5zdGFuY2VUb1BsYWluKHRoaXNbcHJvcGVydHlLZXldLCB7ZW5hYmxlQ2lyY3VsYXJDaGVjazogdHJ1ZX0pXHJcbiAgICAgICAgICAgICAgICAvLyBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSB0aGlzW3Byb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmNvbnN0cnVjdG9yLm5hbWUsIHByb3BlcnR5S2V5LCBcImlzIG90aGVyXCIpXHJcbiAgICAgICAgICAgICAgICAvL290aGVyd2lzZSBwcm9wZXJ0eSBpcyBqdXN0IGEgcHJvcGVydHksIHNvIHdlIGNvbnZlcnQgaXQgYmFzZWQgb24gaXRzIHR5cGUgb3IgZGVjb3JhdG9yXHJcbiAgICAgICAgICAgICAgICBpZihvcHRpb25zLnRpbWVzdGFtcCkge1xyXG4gICAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSB1c2VFbmdpbmUoKS5jb252ZXJ0VG9UaW1lc3RhbXAoKHRoaXNbcHJvcGVydHlLZXldIGFzIGFueSkpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSB0aGlzW3Byb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IG51bGxcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAganNvbi5pZCA9IHRoaXMuaWRcclxuICAgICAgcmV0dXJuIGpzb25cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNvbnZlcnRUb0pzb24ocm9vdDogQXJyYXk8YW55PnxPYmplY3QpOiBhbnkge1xyXG4gICAgICBjb25zdCBqc29uOiBhbnkgPSByb290IGluc3RhbmNlb2YgQXJyYXkgPyBbXSA6IHt9XHJcbiAgICAgIFxyXG4gICAgICBPYmplY3Qua2V5cyhyb290KS5mb3JFYWNoKChrZXkpID0+IHtcclxuICAgICAgICBpZigocm9vdCBhcyBhbnkpW2tleV0gIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgIGlmKChyb290IGFzIGFueSlba2V5XSBpbnN0YW5jZW9mIE1vZGVsKSB7XHJcbiAgICAgICAgICAgIGpzb25ba2V5XSA9IChyb290IGFzIGFueSlba2V5XS50b0pzb24oKSBcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmKChyb290IGFzIGFueSlba2V5XSBpbnN0YW5jZW9mIEFycmF5IHx8IChyb290IGFzIGFueSlba2V5XSBpbnN0YW5jZW9mIE9iamVjdCl7XHJcbiAgICAgICAgICAgICAganNvbltrZXldID0gdGhpcy5jb252ZXJ0VG9Kc29uKChyb290IGFzIGFueSlba2V5XSlcclxuICAgICAgICAgICAgfSBlbHNlIHsgXHJcbiAgICAgICAgICAgICAganNvbltrZXldID0gKHJvb3QgYXMgYW55KVtrZXldXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgfSlcclxuXHJcbiAgICAgIHJldHVybiBqc29uXHJcbiAgICB9XHJcblxyXG4gICAgZnJvbUpzb24oZGF0YTogYW55KTogdGhpcyB7XHJcbiAgICAgIGxldCBhbnlUaGlzID0gdGhpcyBhcyBhbnlcclxuICAgICAgZm9yKGNvbnN0IHByb3BlcnR5S2V5IGluIGRhdGEpIHtcclxuICAgICAgICAvL2lmIHByb3BlcnR5IGV4aXN0cyBpbiBkYXRhIGFuZCBwcm9wZXJ0eSBoYXMgZmllbGQgbWV0YWRhdGEsIHRoZW4gd2UgbXVzdCBjb252ZXJ0IGZyb20ganNvblxyXG4gICAgICAgIGlmKFJlZmxlY3QuaGFzTWV0YWRhdGEoZmllbGRNZXRhZGF0YUtleSwgdGhpcywgcHJvcGVydHlLZXkpKXtcclxuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKGZpZWxkTWV0YWRhdGFLZXksIHRoaXMsIHByb3BlcnR5S2V5KSA/PyB7fSBhcyBGaWVsZENvbmZpZ1xyXG4gICAgICAgICAgY29uc3QganNvblByb3BlcnR5S2V5ID0gb3B0aW9ucy5uYW1lID8/IHByb3BlcnR5S2V5XHJcbiAgICAgICAgICBpZihkYXRhW2pzb25Qcm9wZXJ0eUtleV0pe1xyXG4gICAgICAgICAgICBpZihvcHRpb25zPy5tb2RlbENsYXNzKSB7XHJcbiAgICAgICAgICAgICAgaWYoZGF0YVtqc29uUHJvcGVydHlLZXldIGluc3RhbmNlb2YgQXJyYXkpe1xyXG4gICAgICAgICAgICAgICAgYW55VGhpc1tqc29uUHJvcGVydHlLZXldID0gbmV3IEFycmF5KClcclxuICAgICAgICAgICAgICAgIGRhdGFbanNvblByb3BlcnR5S2V5XS5mb3JFYWNoKCh2YWx1ZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMubW9kZWxDbGFzcy5wcm90b3R5cGUgaW5zdGFuY2VvZiBNb2RlbCl7XHJcbiAgICAgICAgICAgICAgICAgICAgYW55VGhpc1tqc29uUHJvcGVydHlLZXldLnB1c2goKG5ldyBvcHRpb25zLm1vZGVsQ2xhc3MoKSkuZnJvbUpzb24odmFsdWUpKVxyXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGFueVRoaXNbanNvblByb3BlcnR5S2V5XSA9IHBsYWluVG9JbnN0YW5jZShvcHRpb25zLm1vZGVsQ2xhc3MsIHZhbHVlLCB7ZW5hYmxlQ2lyY3VsYXJDaGVjazogdHJ1ZX0pXHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMubW9kZWxDbGFzcy5wcm90b3R5cGUgaW5zdGFuY2VvZiBNb2RlbCl7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbanNvblByb3BlcnR5S2V5XS5wdXNoKChuZXcgb3B0aW9ucy5tb2RlbENsYXNzKCkpLmZyb21Kc29uKGRhdGFbanNvblByb3BlcnR5S2V5XSkpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBhbnlUaGlzW2pzb25Qcm9wZXJ0eUtleV0gPSBwbGFpblRvSW5zdGFuY2Uob3B0aW9ucy5tb2RlbENsYXNzLCBkYXRhW2pzb25Qcm9wZXJ0eUtleV0sIHtlbmFibGVDaXJjdWxhckNoZWNrOiB0cnVlfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgLy8gaWYgcHJvcGVydHkgaXMgYW4gYXJyYXkgb3Igb2JqZWN0IHRoZW4gaXRlcmF0ZSBvdmVyIGl0cyBwcm9wZXJ0aWVzLCBhbmQgY29udmVydCBmcm9tIGpzb24gcmVjdXJzaXZlbHlcclxuICAgICAgICAgICAgICBpZihkYXRhW2pzb25Qcm9wZXJ0eUtleV0gaW5zdGFuY2VvZiBPYmplY3QgfHwgZGF0YVtqc29uUHJvcGVydHlLZXldIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gdGhpcy5jb252ZXJ0RnJvbUpzb24oZGF0YVtqc29uUHJvcGVydHlLZXldKVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvL290aGVyd2lzZSBwcm9wZXJ0eSBpcyBqdXN0IGEgcHJvcGVydHksIHNvIHdlIGNvbnZlcnQgaXQgYmFzZWQgb24gaXRzIHR5cGUgb3IgZGVjb3JhdG9yXHJcbiAgICAgICAgICAgICAgICBpZihvcHRpb25zLnRpbWVzdGFtcCkge1xyXG4gICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IHVzZUVuZ2luZSgpLmNvbnZlcnRGcm9tVGltZXN0YW1wKGRhdGFbanNvblByb3BlcnR5S2V5XSlcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gZGF0YVtqc29uUHJvcGVydHlLZXldXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuaWQgPSBkYXRhLmlkXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjb252ZXJ0RnJvbUpzb24ocm9vdDogQXJyYXk8YW55PnxPYmplY3QpOiBhbnl7XHJcbiAgICAgIGNvbnN0IGpzb246IGFueSA9IHJvb3QgaW5zdGFuY2VvZiBBcnJheSA/IFtdIDoge31cclxuICAgICAgXHJcbiAgICAgIE9iamVjdC5rZXlzKHJvb3QpLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgICAgIGlmKChyb290IGFzIGFueSlba2V5XSBpbnN0YW5jZW9mIEFycmF5IHx8IChyb290IGFzIGFueSlba2V5XSBpbnN0YW5jZW9mIE9iamVjdClcclxuICAgICAgICAgIChqc29uIGFzIGFueSlba2V5XSA9IHRoaXMuY29udmVydEZyb21Kc29uKChyb290IGFzIGFueSlba2V5XSlcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAoanNvbiBhcyBhbnkpW2tleV0gPSAocm9vdCBhcyBhbnkpW2tleV1cclxuICAgICAgfSlcclxuXHJcbiAgICAgIHJldHVybiBqc29uXHJcbiAgICB9XHJcbn1cclxuIl19