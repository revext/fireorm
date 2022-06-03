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
            //reverse back the array 
            relations.reverse();
            if (anyThis[loadedProperty] instanceof Array) {
                const promises = [];
                for (const index in anyThis[loadedProperty]) {
                    promises.push(anyThis[loadedProperty][index].load(relations.join('.')));
                }
                await Promise.all(promises);
            }
            else {
                await anyThis[loadedProperty].load(relations.join('.'));
            }
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
                const options = ((_a = Reflect.getMetadata(MetadataKeys_1.fieldMetadataKey, this, propertyKey)) !== null && _a !== void 0 ? _a : {});
                const jsonPropertyKey = (_b = options.name) !== null && _b !== void 0 ? _b : propertyKey;
                if (this[propertyKey] !== undefined) {
                    if (this[propertyKey] instanceof Model) {
                        // if the property is a model, then we must convert into json
                        json[jsonPropertyKey] = this[propertyKey].toJson();
                    }
                    else {
                        //if property is an array or object then iterate over its properties, and convert into json recursively
                        if (this[propertyKey] instanceof Array) {
                            json[jsonPropertyKey] = this.convertToJson(this[propertyKey]);
                        }
                        else if (this[propertyKey] instanceof Object) {
                            json[jsonPropertyKey] = (0, class_transformer_1.instanceToPlain)(this[propertyKey], { enableCircularCheck: true });
                            // json[jsonPropertyKey] = this[propertyKey]
                        }
                        else {
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
                        if (options.timestamp) {
                            anyThis[propertyKey] = (0, engine_1.useEngine)().convertFromTimestamp(data[jsonPropertyKey]);
                        }
                        else {
                            if (data[jsonPropertyKey] instanceof Object || data[jsonPropertyKey] instanceof Array) {
                                //if property is an array or object then iterate over its properties, and convert from json recursively
                                anyThis[propertyKey] = this.convertFromJson(data[jsonPropertyKey]);
                            }
                            else {
                                //otherwise property is just a property, so we convert it based on its type or decorator
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbW9kZWxzL01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsOERBQStDO0FBRS9DLDZEQUErSDtBQUMvSCxzQ0FBc0M7QUFDdEMsa0RBQW1EO0FBS25ELDJDQUF3QztBQUN4QywwQkFBMkI7QUFDM0IseURBQXFFO0FBTXJFLE1BQThCLEtBQUs7SUFNL0IsWUFBWSxHQUFHLE1BQWE7UUFKNUIsT0FBRSxHQUFZLElBQUksQ0FBQTtRQUVsQixvQkFBZSxHQUFhLEVBQUUsQ0FBQTtRQVF0QixXQUFNLEdBQVcsSUFBSSxDQUFBO1FBTDNCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDbkIsQ0FBQztJQUVELElBQUksQ0FBQyxDQUFRLElBQVUsT0FBTSxDQUFDLENBQUM7SUFJdkIsWUFBWTs7UUFFbEIsSUFBSSxLQUFLLEdBQW9CLEVBQUUsQ0FBQTtRQUMvQixLQUFJLE1BQU0sV0FBVyxJQUFJLElBQUksRUFBQztZQUM1Qiw2Q0FBNkM7WUFDN0MsSUFBRyxPQUFPLENBQUMsV0FBVyxDQUFDLGtDQUFtQixFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsRUFBQztnQkFDN0QsTUFBTSxJQUFJLEdBQUcsTUFBQSxPQUFPLENBQUMsV0FBVyxDQUFDLGtDQUFtQixFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsbUNBQUksRUFBdUIsQ0FBQTtnQkFFbkcsSUFBRyxJQUFJLFlBQVksUUFBUSxFQUFDO29CQUMxQixLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7aUJBQ3pDO3FCQUFNLElBQUcsSUFBSSxZQUFZLE1BQU0sRUFBQztvQkFDL0IsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFBO2lCQUNuQztx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LElBQVksQ0FBQyxHQUFHLENBQUMsWUFBWSxNQUFNO2dCQUMzRSxJQUFZLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBRSxJQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTs7Z0JBRTVELElBQVksQ0FBQyxHQUFHLENBQUMsR0FBSSxJQUFZLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDM0MsQ0FBQyxDQUFDLENBQUE7UUFFRixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7Q0FDSjtBQXhVRztJQURDLElBQUEsU0FBSyxHQUFFOztpQ0FDVTtBQUZ0Qix3QkEwVUMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuaW1wb3J0IFZhbGlkYXRvciwgeyBFcnJvcnMgfSBmcm9tIFwidmFsaWRhdG9yanNcIlxyXG5pbXBvcnQgUmVwb3NpdG9yeSBmcm9tIFwifi9yZXBvc2l0b3JpZXMvUmVwb3NpdG9yeVwiO1xyXG5pbXBvcnQgeyBjb2xsZWN0aW9uTWV0YWRhdGFLZXksIGZpZWxkTWV0YWRhdGFLZXksIHJlbGF0aW9uTWV0YWRhdGFLZXksIHZhbGlkYXRlTWV0YWRhdGFLZXkgfSBmcm9tIFwiLi4vZGVjb3JhdG9ycy9NZXRhZGF0YUtleXNcIjtcclxuaW1wb3J0IHsgdXNlRW5naW5lIH0gZnJvbSBcIi4uL2VuZ2luZVwiO1xyXG5pbXBvcnQgeyBnZXRSZXBvc2l0b3J5Rm9yIH0gZnJvbSBcIi4uL3JlcG9zaXRvcmllc1wiO1xyXG5pbXBvcnQgeyBIYXNNYW55UmVsYXRpb25Db25maWcsIFJlbGF0aW9uQ29uZmlnV2l0aFR5cGUgfSBmcm9tIFwiLi4vdHlwZXMvY29uZmlncy9SZWxhdGlvbkNvbmZpZ1wiO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3RvckZ1bmN0aW9uIH0gZnJvbSBcIi4uL3R5cGVzL2Z1bmN0aW9ucy9Db25zdHJ1Y3RvckZ1bmN0aW9uXCI7XHJcbmltcG9ydCB7IEZpZWxkQ29uZmlnIH0gZnJvbSBcIi4uL3R5cGVzL2NvbmZpZ3MvRmllbGRDb25maWdcIjtcclxuaW1wb3J0IHsgVmFsaWRhdGVDb25maWcgfSBmcm9tIFwiLi4vdHlwZXMvY29uZmlncy9WYWxpZGF0ZUNvbmZpZ1wiO1xyXG5pbXBvcnQgeyBCbHVlcHJpbnQgfSBmcm9tIFwiLi9CbHVlcHJpbnRcIjtcclxuaW1wb3J0IHsgRmllbGQgfSBmcm9tIFwiLi5cIjtcclxuaW1wb3J0IHsgaW5zdGFuY2VUb1BsYWluLCBwbGFpblRvSW5zdGFuY2UgfSBmcm9tIFwiY2xhc3MtdHJhbnNmb3JtZXJcIjtcclxuXHJcblxyXG5leHBvcnQgdHlwZSBQYXJhbXNPYmplY3QgPSB7IFtrZXk6IHN0cmluZ106IGFueSB9O1xyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFic3RyYWN0IGNsYXNzIE1vZGVsIHtcclxuICAgIEBGaWVsZCgpXHJcbiAgICBpZD86IHN0cmluZyA9IG51bGxcclxuXHJcbiAgICByZWxhdGlvbnNMb2FkZWQ6IHN0cmluZ1tdID0gW11cclxuXHJcbiAgICBjb25zdHJ1Y3RvciguLi5wYXJhbXM6IGFueVtdKSB7XHJcbiAgICAgIHRoaXMuaW5pdChwYXJhbXMpXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdChfOiBhbnlbXSk6IHZvaWQgeyByZXR1cm4gfVxyXG5cclxuICAgIHByaXZhdGUgZXJyb3JzOiBFcnJvcnMgPSBudWxsXHJcblxyXG4gICAgcHJpdmF0ZSBjb2xsZWN0UnVsZXM8VD4oKTogVmFsaWRhdG9yLlJ1bGVzIHtcclxuICAgICAgXHJcbiAgICAgIGxldCBydWxlczogVmFsaWRhdG9yLlJ1bGVzID0ge31cclxuICAgICAgZm9yKGNvbnN0IHByb3BlcnR5S2V5IGluIHRoaXMpe1xyXG4gICAgICAgIC8vVE9ETyByZWN1cnNpdmUgdmFsaWRhdGlvbiBvbiByZWxhdGVkIG1vZGVsc1xyXG4gICAgICAgIGlmKFJlZmxlY3QuaGFzTWV0YWRhdGEodmFsaWRhdGVNZXRhZGF0YUtleSwgdGhpcywgcHJvcGVydHlLZXkpKXtcclxuICAgICAgICAgIGNvbnN0IHJ1bGUgPSBSZWZsZWN0LmdldE1ldGFkYXRhKHZhbGlkYXRlTWV0YWRhdGFLZXksIHRoaXMsIHByb3BlcnR5S2V5KSA/PyB7fSBhcyBWYWxpZGF0ZUNvbmZpZzxUPlxyXG5cclxuICAgICAgICAgIGlmKHJ1bGUgaW5zdGFuY2VvZiBGdW5jdGlvbil7XHJcbiAgICAgICAgICAgIHJ1bGVzID0gT2JqZWN0LmFzc2lnbihydWxlcywgcnVsZSh0aGlzKSlcclxuICAgICAgICAgIH0gZWxzZSBpZihydWxlIGluc3RhbmNlb2YgT2JqZWN0KXtcclxuICAgICAgICAgICAgcnVsZXMgPSBPYmplY3QuYXNzaWduKHJ1bGVzLCBydWxlKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcnVsZXNbcHJvcGVydHlLZXldID0gcnVsZVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcnVsZXNcclxuICAgIH1cclxuXHJcbiAgICB2YWxpZGF0ZSAoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgcnVsZXMgPSB0aGlzLmNvbGxlY3RSdWxlcygpXHJcbiAgICAgICAgbGV0IHZhbGlkYXRvciA9IG5ldyBWYWxpZGF0b3IodGhpcyBhcyBhbnksIHJ1bGVzKVxyXG5cclxuICAgICAgICBpZiAodmFsaWRhdG9yLmhhc0FzeW5jKSB7XHJcbiAgICAgICAgICB2YWxpZGF0b3IuY2hlY2tBc3luYyhyZXNvbHZlLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzID0gdmFsaWRhdG9yLmVycm9yc1xyXG4gICAgICAgICAgICByZWplY3QoKVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKHZhbGlkYXRvci5jaGVjaygpKSB7XHJcbiAgICAgICAgICAgIHJlc29sdmUoKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lcnJvcnMgPSB2YWxpZGF0b3IuZXJyb3JzXHJcbiAgICAgICAgICAgIHJlamVjdCgpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIGhhc0Vycm9ycyAoKTogYm9vbGVhbiB7XHJcbiAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmVycm9ycyA/PyB7fSkubGVuZ3RoID4gMFxyXG4gICAgfVxyXG5cclxuICAgIGdldEFsbEVycm9ycyAoKTogVmFsaWRhdG9yLlZhbGlkYXRpb25FcnJvcnMge1xyXG4gICAgICByZXR1cm4gdGhpcy5lcnJvcnM/LmFsbCgpXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RXJyb3JzIChuYW1lOiBzdHJpbmcpOiBBcnJheTxzdHJpbmc+IHwgZmFsc2Uge1xyXG4gICAgICByZXR1cm4gdGhpcy5lcnJvcnM/LmdldChuYW1lKVxyXG4gICAgfVxyXG5cclxuICAgIGdldEVycm9yIChuYW1lOiBzdHJpbmcpOiBzdHJpbmcgfCBmYWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmVycm9ycz8uZmlyc3QobmFtZSlcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBsb2FkTWFueShyZWxhdGlvbk5hbWVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD57XHJcbiAgICAgIGNvbnN0IHByb21pc2VzID0gW11cclxuICAgICAgZm9yKGNvbnN0IHJlbGF0aW9uIGluIHJlbGF0aW9uTmFtZXMpe1xyXG4gICAgICAgIHByb21pc2VzLnB1c2godGhpcy5sb2FkKHJlbGF0aW9uTmFtZXNbcmVsYXRpb25dKSlcclxuICAgICAgfVxyXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcylcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBsb2FkKHJlbGF0aW9uTmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgIGxldCBmb3VuZCA9IGZhbHNlXHJcbiAgICAgIGNvbnN0IGFueVRoaXMgPSB0aGlzIGFzIGFueVxyXG5cclxuICAgICAgY29uc3QgcmVsYXRpb25zID0gcmVsYXRpb25OYW1lLnNwbGl0KCcuJylcclxuICAgICAgcmVsYXRpb25OYW1lID0gcmVsYXRpb25zLnJldmVyc2UoKS5wb3AoKVxyXG5cclxuICAgICAgbGV0IGxvYWRlZFByb3BlcnR5ID0gcmVsYXRpb25OYW1lXHJcbiAgICAgIFxyXG4gICAgICBpZighdGhpcy5yZWxhdGlvbnNMb2FkZWQuaW5jbHVkZXMocmVsYXRpb25OYW1lKSl7XHJcbiAgICAgICAgY29uc3Qgcm91dGVQYXJhbXMgPSB0aGlzLmdldFJvdXRlUGFyYW1ldGVyTWFwcGluZygpXHJcbiAgICAgICAgZm9yKGNvbnN0IHByb3BlcnR5S2V5IGluIHRoaXMpIHtcclxuICAgICAgICAgIGlmKFJlZmxlY3QuaGFzTWV0YWRhdGEocmVsYXRpb25NZXRhZGF0YUtleSwgdGhpcywgcHJvcGVydHlLZXkpKXtcclxuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEocmVsYXRpb25NZXRhZGF0YUtleSwgdGhpcywgcHJvcGVydHlLZXkpID8/IHt9IGFzIFJlbGF0aW9uQ29uZmlnV2l0aFR5cGVcclxuICAgICAgICAgICAgLy9nZXQgdGhlIHJlcG9zaXRvcnkgZm9yIHRoZSBjdXJyZW50IG1vZGVsQ2xhc3NcclxuICAgICAgICAgICAgY29uc3QgcmVwb3NpdG9yeSA9IGdldFJlcG9zaXRvcnlGb3Iob3B0aW9ucy5tb2RlbENsYXNzIGFzIENvbnN0cnVjdG9yRnVuY3Rpb248TW9kZWw+KSBhcyBSZXBvc2l0b3J5PE1vZGVsPlxyXG4gICAgICAgICAgICBpZigob3B0aW9ucy5uYW1lICYmIG9wdGlvbnMubmFtZSA9PT0gcmVsYXRpb25OYW1lKSB8fCBwcm9wZXJ0eUtleSA9PT0gcmVsYXRpb25OYW1lKSB7XHJcbiAgICAgICAgICAgICAgbG9hZGVkUHJvcGVydHkgPSBwcm9wZXJ0eUtleVxyXG4gICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZVxyXG4gICAgICAgICAgICAgIGlmKG9wdGlvbnMudHlwZSA9PT0gJ2hhc01hbnknKXtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhhc01hbnlPcHRpb25zID0gb3B0aW9ucyBhcyBIYXNNYW55UmVsYXRpb25Db25maWdcclxuICAgICAgICAgICAgICAgIGlmKCFoYXNNYW55T3B0aW9ucy5tYXBJZHMgJiYgIWhhc01hbnlPcHRpb25zLnJlbGF0ZWRJZHMpe1xyXG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEBIYXNNYW55IHJlbGF0aW9uICR7cmVsYXRpb25OYW1lfSBvbiAke3RoaXMuY29uc3RydWN0b3IubmFtZX0gaXMgbWlzc2luZyAnbWFwSWRzJyBhbmQgJ3JlbGF0ZWRJZHMnLiBPbmUgb2YgdGhlbSBtdXN0IGJlIGRlZmluZWQuYClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKGFueVRoaXNbcHJvcGVydHlLZXldIGluc3RhbmNlb2YgQXJyYXkgfHwgYW55VGhpc1twcm9wZXJ0eUtleV0gPT09IHVuZGVmaW5lZCB8fCBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IGF3YWl0IHJlcG9zaXRvcnkubG9hZE1hbnkoKGhhc01hbnlPcHRpb25zLm1hcElkcyA/IGhhc01hbnlPcHRpb25zLm1hcElkcyh0aGlzKSA6IGFueVRoaXNbaGFzTWFueU9wdGlvbnMucmVsYXRlZElkc10pLCByb3V0ZVBhcmFtcylcclxuICAgICAgICAgICAgICAgICAgaWYob3B0aW9ucy5mb3JlaWduUHJvcGVydHkpe1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcihjb25zdCBpbmRleCBpbiBhbnlUaGlzW3Byb3BlcnR5S2V5XSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XVtpbmRleF1bb3B0aW9ucy5mb3JlaWduUHJvcGVydHldID0gdGhpc1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZWxhdGlvbiAke3JlbGF0aW9uTmFtZX0gd2l0aCAnJHtvcHRpb25zLnR5cGV9JyBvbiAke29wdGlvbnMucmVsYXRlZElkfSBwcm9wZXJ0eSBpcyBub3QgYW4gYXJyYXlgKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZihvcHRpb25zLnR5cGUgPT09ICdoYXNDb2xsZWN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgLy9UT0RPIGFuIG9wdGlvbiB3aGVyZSB0aGUgcmVsYXRlZCBkYXRhIGNhbiBiZSAncGFnaW5hdGVkJ1xyXG4gICAgICAgICAgICAgICAgLy9jaGVjayBpZiBwcm9wZXJ0eSBpcyBhcnJheSwgdGhlbiBsb2FkIHRoZSBzdWJjb2xsZWN0aW9uIGludG8gaXRcclxuICAgICAgICAgICAgICAgIGlmKGFueVRoaXNbcHJvcGVydHlLZXldIGluc3RhbmNlb2YgQXJyYXkgfHwgYW55VGhpc1twcm9wZXJ0eUtleV0gPT09IHVuZGVmaW5lZCB8fCBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IGF3YWl0IHJlcG9zaXRvcnkubG9hZENvbGxlY3Rpb24ocm91dGVQYXJhbXMpXHJcbiAgICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMuZm9yZWlnblByb3BlcnR5KXtcclxuICAgICAgICAgICAgICAgICAgICBmb3IoY29uc3QgaW5kZXggaW4gYW55VGhpc1twcm9wZXJ0eUtleV0pe1xyXG4gICAgICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV1baW5kZXhdW29wdGlvbnMuZm9yZWlnblByb3BlcnR5XSA9IHRoaXNcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUmVsYXRpb24gJHtyZWxhdGlvbk5hbWV9IHdpdGggJyR7b3B0aW9ucy50eXBlfScgb24gJHtwcm9wZXJ0eUtleX0gcHJvcGVydHkgaXMgbm90IGFuIGFycmF5YClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy9sb2FkIGRhdGEgaW50byB0aGUgJ3Byb3BlcnR5S2V5JyBwcm9wZXJ0eSBvZiB0aGUgbW9kZWwsIHdoaWxlIGxvYWQgdGhlIG1vZGVsIHdpdGggdGhlIGlkIGZyb20gdGhlICdyZWxhdGVkSWQnIHByb3BlcnR5XHJcbiAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IGF3YWl0IHJlcG9zaXRvcnkubG9hZCgodGhpcyBhcyBhbnkpW29wdGlvbnMucmVsYXRlZElkXSwgcm91dGVQYXJhbXMpXHJcbiAgICAgICAgICAgICAgICBpZihvcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eSl7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldW29wdGlvbnMuZm9yZWlnblByb3BlcnR5XSA9IHRoaXNcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAgIGlmKCFmb3VuZCl7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFJlbGF0aW9uICR7cmVsYXRpb25OYW1lfSBub3QgZm91bmQgb24gJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9YClcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5yZWxhdGlvbnNMb2FkZWQucHVzaChyZWxhdGlvbk5hbWUpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmKHJlbGF0aW9ucy5sZW5ndGggPiAwKXtcclxuICAgICAgICAvL3JldmVyc2UgYmFjayB0aGUgYXJyYXkgXHJcbiAgICAgICAgcmVsYXRpb25zLnJldmVyc2UoKVxyXG4gICAgICAgIGlmKGFueVRoaXNbbG9hZGVkUHJvcGVydHldIGluc3RhbmNlb2YgQXJyYXkpe1xyXG4gICAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXVxyXG4gICAgICAgICAgZm9yKGNvbnN0IGluZGV4IGluIGFueVRoaXNbbG9hZGVkUHJvcGVydHldKXtcclxuICAgICAgICAgICAgcHJvbWlzZXMucHVzaChhbnlUaGlzW2xvYWRlZFByb3BlcnR5XVtpbmRleF0ubG9hZChyZWxhdGlvbnMuam9pbignLicpKSlcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBhd2FpdCBhbnlUaGlzW2xvYWRlZFByb3BlcnR5XS5sb2FkKHJlbGF0aW9ucy5qb2luKCcuJykpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Qmx1ZXByaW50PFQgZXh0ZW5kcyBNb2RlbD4odGhpczogVCk6IEJsdWVwcmludDxUPiB7XHJcbiAgICAgIHJldHVybiBuZXcgQmx1ZXByaW50KHRoaXMsIHRoaXMuZ2V0Um91dGVQYXJhbWV0ZXJNYXBwaW5nKCkpXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Um91dGUoKTogc3RyaW5nIHtcclxuICAgICAgY29uc3Qgb3B0aW9ucyA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoY29sbGVjdGlvbk1ldGFkYXRhS2V5LCB0aGlzLmNvbnN0cnVjdG9yKSA/PyB7fVxyXG4gICAgICBpZighb3B0aW9ucyB8fCAhb3B0aW9ucy5yb3V0ZSl7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDbGFzcyAke3RoaXMuY29uc3RydWN0b3IubmFtZX0gZG9lc24ndCBoYXZlIGEgcm91dGUgcGFyYW1ldGVyIG9uIHRoZSBAQ29sbGVjdGlvbiBhbm5vdGF0aW9uYClcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gb3B0aW9ucy5yb3V0ZVxyXG4gICAgfVxyXG5cclxuICAgIGdldFJvdXRlUGFyYW1ldGVyTWFwcGluZygpOiBQYXJhbXNPYmplY3Qge1xyXG4gICAgICBjb25zdCBzZWFyY2hSZWdleCA9IC97KFtefV0rKX0vZ1xyXG4gICAgICBpZihSZWZsZWN0Lmhhc01ldGFkYXRhKGNvbGxlY3Rpb25NZXRhZGF0YUtleSwgdGhpcy5jb25zdHJ1Y3RvcikpIHtcclxuICAgICAgICBjb25zdCBvcHRpb25zID0gUmVmbGVjdC5nZXRNZXRhZGF0YShjb2xsZWN0aW9uTWV0YWRhdGFLZXksIHRoaXMuY29uc3RydWN0b3IpID8/IHt9XHJcbiAgICAgICAgaWYoIW9wdGlvbnMgfHwgIW9wdGlvbnMucm91dGUpe1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDbGFzcyAke3RoaXMuY29uc3RydWN0b3IubmFtZX0gZG9lc24ndCBoYXZlIGEgcm91dGUgcGFyYW1ldGVyIG9uIHRoZSBAQ29sbGVjdGlvbiBhbm5vdGF0aW9uYClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHBhdGhUZW1wbGF0ZSA9IG9wdGlvbnMucm91dGVcclxuICAgICAgICBjb25zdCBwYXJhbXMgPSBzZWFyY2hSZWdleC5leGVjKHBhdGhUZW1wbGF0ZSlcclxuXHJcbiAgICAgICAgY29uc3QgcmV0dXJuUGFyYW1zOiBzdHJpbmdbXSA9IFtdXHJcbiAgICAgICAgLy9pZiBoYXMgcm91dGUgcGFyYW1cclxuICAgICAgICBpZihwYXJhbXMpe1xyXG4gICAgICAgICAgLy9jaGVjayB0byBzZWUgaWYgcm91dGUgcGFyYW0gaXMgYSBwcm9wZXJ0eSBvZiB0aGUgbW9kZWwgYW5kIGl0IGlzIHNldFxyXG4gICAgICAgICAgcGFyYW1zLmZvckVhY2goKHBhcmFtKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtU3RyaXAgPSBwYXJhbS5yZXBsYWNlKC9be31dL2csICcnKVxyXG4gICAgICAgICAgICBpZighKHRoaXMgYXMgYW55KVtwYXJhbVN0cmlwXSl7XHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZXF1aXJlZCByb3V0ZSBwYXJhbSAke3BhcmFtU3RyaXB9IGlzIG5vdCBzZXQgb24gdGhlIGNsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfWApXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYoIXJldHVyblBhcmFtcy5pbmNsdWRlcyhwYXJhbVN0cmlwKSkgcmV0dXJuUGFyYW1zLnB1c2gocGFyYW1TdHJpcClcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL2dldCBldmVyeSBwYXJhbSB3aGljaCBoYXMgYmVlbiBhbm5vdGF0ZWQgaW4gdGhlIG1vZGVsIHdpdGggJ3JvdXRlUGFyYW06IHRydWUnXHJcbiAgICAgICAgY29uc3QgcGFyYW1zT2JqZWN0OiBQYXJhbXNPYmplY3QgPSB7fVxyXG4gICAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiB0aGlzKSB7XHJcbiAgICAgICAgICBpZihSZWZsZWN0Lmhhc01ldGFkYXRhKGZpZWxkTWV0YWRhdGFLZXksIHRoaXMsIHByb3BlcnR5S2V5KSl7XHJcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKGZpZWxkTWV0YWRhdGFLZXksIHRoaXMsIHByb3BlcnR5S2V5KSA/PyB7fSBhcyBGaWVsZENvbmZpZ1xyXG5cclxuICAgICAgICAgICAgaWYob3B0aW9ucy5yb3V0ZVBhcmFtKXtcclxuICAgICAgICAgICAgICBwYXJhbXNPYmplY3Rbb3B0aW9ucy5uYW1lID8/IHByb3BlcnR5S2V5XSA9IHRoaXNbcHJvcGVydHlLZXldXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHBhcmFtc09iamVjdFxyXG5cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBpcyBub3QgYW5ub3RhdGVkIHdpdGggQENvbGxlY3Rpb25gKVxyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHRvSnNvbigpOiBhbnkge1xyXG4gICAgICBjb25zdCBqc29uOiBhbnkgPSB7fVxyXG5cclxuICAgICAgZm9yKGNvbnN0IHByb3BlcnR5S2V5IGluIHRoaXMpIHtcclxuICAgICAgICAvLyBpZiBwcm9wZXJ0eSBoYXMgZmllbGQgbWV0YWRhdGEsIHRoZW4gd2UgbXVzdCBjb252ZXJ0IGludG8ganNvblxyXG4gICAgICAgIGlmKFJlZmxlY3QuaGFzTWV0YWRhdGEoZmllbGRNZXRhZGF0YUtleSwgdGhpcywgcHJvcGVydHlLZXkpKXtcclxuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSAoUmVmbGVjdC5nZXRNZXRhZGF0YShmaWVsZE1ldGFkYXRhS2V5LCB0aGlzLCBwcm9wZXJ0eUtleSkgPz8ge30pIGFzIEZpZWxkQ29uZmlnXHJcbiAgICAgICAgICBjb25zdCBqc29uUHJvcGVydHlLZXkgPSBvcHRpb25zLm5hbWUgPz8gcHJvcGVydHlLZXlcclxuICAgICAgICAgIGlmKHRoaXNbcHJvcGVydHlLZXldICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICBpZih0aGlzW3Byb3BlcnR5S2V5XSBpbnN0YW5jZW9mIE1vZGVsKSB7XHJcbiAgICAgICAgICAgICAgLy8gaWYgdGhlIHByb3BlcnR5IGlzIGEgbW9kZWwsIHRoZW4gd2UgbXVzdCBjb252ZXJ0IGludG8ganNvblxyXG4gICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9ICh0aGlzW3Byb3BlcnR5S2V5XSBhcyB1bmtub3duIGFzIE1vZGVsKS50b0pzb24oKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIC8vaWYgcHJvcGVydHkgaXMgYW4gYXJyYXkgb3Igb2JqZWN0IHRoZW4gaXRlcmF0ZSBvdmVyIGl0cyBwcm9wZXJ0aWVzLCBhbmQgY29udmVydCBpbnRvIGpzb24gcmVjdXJzaXZlbHlcclxuICAgICAgICAgICAgICBpZih0aGlzW3Byb3BlcnR5S2V5XSBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSB0aGlzLmNvbnZlcnRUb0pzb24odGhpc1twcm9wZXJ0eUtleV0pXHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmKHRoaXNbcHJvcGVydHlLZXldIGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSBpbnN0YW5jZVRvUGxhaW4odGhpc1twcm9wZXJ0eUtleV0sIHtlbmFibGVDaXJjdWxhckNoZWNrOiB0cnVlfSlcclxuICAgICAgICAgICAgICAgIC8vIGpzb25banNvblByb3BlcnR5S2V5XSA9IHRoaXNbcHJvcGVydHlLZXldXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vb3RoZXJ3aXNlIHByb3BlcnR5IGlzIGp1c3QgYSBwcm9wZXJ0eSwgc28gd2UgY29udmVydCBpdCBiYXNlZCBvbiBpdHMgdHlwZSBvciBkZWNvcmF0b3JcclxuICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMudGltZXN0YW1wKSB7XHJcbiAgICAgICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IHVzZUVuZ2luZSgpLmNvbnZlcnRUb1RpbWVzdGFtcCgodGhpc1twcm9wZXJ0eUtleV0gYXMgYW55KSlcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IHRoaXNbcHJvcGVydHlLZXldXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldID0gbnVsbFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBqc29uLmlkID0gdGhpcy5pZFxyXG4gICAgICByZXR1cm4ganNvblxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29udmVydFRvSnNvbihyb290OiBBcnJheTxhbnk+fE9iamVjdCk6IGFueSB7XHJcbiAgICAgIGNvbnN0IGpzb246IGFueSA9IHJvb3QgaW5zdGFuY2VvZiBBcnJheSA/IFtdIDoge31cclxuICAgICAgXHJcbiAgICAgIE9iamVjdC5rZXlzKHJvb3QpLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgICAgIGlmKChyb290IGFzIGFueSlba2V5XSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgaWYoKHJvb3QgYXMgYW55KVtrZXldIGluc3RhbmNlb2YgTW9kZWwpIHtcclxuICAgICAgICAgICAganNvbltrZXldID0gKHJvb3QgYXMgYW55KVtrZXldLnRvSnNvbigpIFxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYoKHJvb3QgYXMgYW55KVtrZXldIGluc3RhbmNlb2YgQXJyYXkgfHwgKHJvb3QgYXMgYW55KVtrZXldIGluc3RhbmNlb2YgT2JqZWN0KXtcclxuICAgICAgICAgICAgICBqc29uW2tleV0gPSB0aGlzLmNvbnZlcnRUb0pzb24oKHJvb3QgYXMgYW55KVtrZXldKVxyXG4gICAgICAgICAgICB9IGVsc2UgeyBcclxuICAgICAgICAgICAgICBqc29uW2tleV0gPSAocm9vdCBhcyBhbnkpW2tleV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgcmV0dXJuIGpzb25cclxuICAgIH1cclxuXHJcbiAgICBmcm9tSnNvbihkYXRhOiBhbnkpOiB0aGlzIHtcclxuICAgICAgbGV0IGFueVRoaXMgPSB0aGlzIGFzIGFueVxyXG4gICAgICBmb3IoY29uc3QgcHJvcGVydHlLZXkgaW4gZGF0YSkge1xyXG4gICAgICAgIC8vaWYgcHJvcGVydHkgZXhpc3RzIGluIGRhdGEgYW5kIHByb3BlcnR5IGhhcyBmaWVsZCBtZXRhZGF0YSwgdGhlbiB3ZSBtdXN0IGNvbnZlcnQgZnJvbSBqc29uXHJcbiAgICAgICAgaWYoUmVmbGVjdC5oYXNNZXRhZGF0YShmaWVsZE1ldGFkYXRhS2V5LCB0aGlzLCBwcm9wZXJ0eUtleSkpe1xyXG4gICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoZmllbGRNZXRhZGF0YUtleSwgdGhpcywgcHJvcGVydHlLZXkpID8/IHt9IGFzIEZpZWxkQ29uZmlnXHJcbiAgICAgICAgICBjb25zdCBqc29uUHJvcGVydHlLZXkgPSBvcHRpb25zLm5hbWUgPz8gcHJvcGVydHlLZXlcclxuICAgICAgICAgIGlmKGRhdGFbanNvblByb3BlcnR5S2V5XSl7XHJcbiAgICAgICAgICAgIGlmKG9wdGlvbnM/Lm1vZGVsQ2xhc3MpIHtcclxuICAgICAgICAgICAgICBpZihkYXRhW2pzb25Qcm9wZXJ0eUtleV0gaW5zdGFuY2VvZiBBcnJheSl7XHJcbiAgICAgICAgICAgICAgICBhbnlUaGlzW2pzb25Qcm9wZXJ0eUtleV0gPSBuZXcgQXJyYXkoKVxyXG4gICAgICAgICAgICAgICAgZGF0YVtqc29uUHJvcGVydHlLZXldLmZvckVhY2goKHZhbHVlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgaWYob3B0aW9ucy5tb2RlbENsYXNzLnByb3RvdHlwZSBpbnN0YW5jZW9mIE1vZGVsKXtcclxuICAgICAgICAgICAgICAgICAgICBhbnlUaGlzW2pzb25Qcm9wZXJ0eUtleV0ucHVzaCgobmV3IG9wdGlvbnMubW9kZWxDbGFzcygpKS5mcm9tSnNvbih2YWx1ZSkpXHJcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYW55VGhpc1tqc29uUHJvcGVydHlLZXldID0gcGxhaW5Ub0luc3RhbmNlKG9wdGlvbnMubW9kZWxDbGFzcywgdmFsdWUsIHtlbmFibGVDaXJjdWxhckNoZWNrOiB0cnVlfSlcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYob3B0aW9ucy5tb2RlbENsYXNzLnByb3RvdHlwZSBpbnN0YW5jZW9mIE1vZGVsKXtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1tqc29uUHJvcGVydHlLZXldLnB1c2goKG5ldyBvcHRpb25zLm1vZGVsQ2xhc3MoKSkuZnJvbUpzb24oZGF0YVtqc29uUHJvcGVydHlLZXldKSlcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbanNvblByb3BlcnR5S2V5XSA9IHBsYWluVG9JbnN0YW5jZShvcHRpb25zLm1vZGVsQ2xhc3MsIGRhdGFbanNvblByb3BlcnR5S2V5XSwge2VuYWJsZUNpcmN1bGFyQ2hlY2s6IHRydWV9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBpZihvcHRpb25zLnRpbWVzdGFtcCkge1xyXG4gICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSB1c2VFbmdpbmUoKS5jb252ZXJ0RnJvbVRpbWVzdGFtcChkYXRhW2pzb25Qcm9wZXJ0eUtleV0pXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmKGRhdGFbanNvblByb3BlcnR5S2V5XSBpbnN0YW5jZW9mIE9iamVjdCB8fCBkYXRhW2pzb25Qcm9wZXJ0eUtleV0gaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgICAgICAgICAgICAgLy9pZiBwcm9wZXJ0eSBpcyBhbiBhcnJheSBvciBvYmplY3QgdGhlbiBpdGVyYXRlIG92ZXIgaXRzIHByb3BlcnRpZXMsIGFuZCBjb252ZXJ0IGZyb20ganNvbiByZWN1cnNpdmVseVxyXG4gICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSB0aGlzLmNvbnZlcnRGcm9tSnNvbihkYXRhW2pzb25Qcm9wZXJ0eUtleV0pXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAvL290aGVyd2lzZSBwcm9wZXJ0eSBpcyBqdXN0IGEgcHJvcGVydHksIHNvIHdlIGNvbnZlcnQgaXQgYmFzZWQgb24gaXRzIHR5cGUgb3IgZGVjb3JhdG9yXHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gZGF0YVtqc29uUHJvcGVydHlLZXldXHJcbiAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuaWQgPSBkYXRhLmlkXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjb252ZXJ0RnJvbUpzb24ocm9vdDogQXJyYXk8YW55PnxPYmplY3QpOiBhbnl7XHJcbiAgICAgIGNvbnN0IGpzb246IGFueSA9IHJvb3QgaW5zdGFuY2VvZiBBcnJheSA/IFtdIDoge31cclxuICAgICAgXHJcbiAgICAgIE9iamVjdC5rZXlzKHJvb3QpLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgICAgIGlmKChyb290IGFzIGFueSlba2V5XSBpbnN0YW5jZW9mIEFycmF5IHx8IChyb290IGFzIGFueSlba2V5XSBpbnN0YW5jZW9mIE9iamVjdClcclxuICAgICAgICAgIChqc29uIGFzIGFueSlba2V5XSA9IHRoaXMuY29udmVydEZyb21Kc29uKChyb290IGFzIGFueSlba2V5XSlcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAoanNvbiBhcyBhbnkpW2tleV0gPSAocm9vdCBhcyBhbnkpW2tleV1cclxuICAgICAgfSlcclxuXHJcbiAgICAgIHJldHVybiBqc29uXHJcbiAgICB9XHJcbn1cclxuIl19