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
const engine_1 = require("../engine");
const repositories_1 = require("../repositories");
const Blueprint_1 = require("./Blueprint");
const __1 = require("..");
const class_transformer_1 = require("class-transformer");
//TODO events before delete, after delet, before load, before-after save, update etc...
class Model {
    constructor(..._) {
        this.id = null;
        this.relationsLoaded = [];
        this.errors = null;
    }
    init(..._) { return; }
    reset() { return; }
    collectRules() {
        var _a;
        const prototype = Object.getPrototypeOf(this);
        const ruleData = (_a = prototype.rules) !== null && _a !== void 0 ? _a : {};
        const ruleKeys = Object.keys(ruleData);
        let rules = {};
        for (const propertyKey in this) {
            //TODO recursive validation on related models
            if (ruleKeys.includes(propertyKey)) {
                const rule = ruleData[propertyKey];
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
                    reject(this.errors);
                });
            }
            else {
                if (validator.check()) {
                    resolve();
                }
                else {
                    this.errors = validator.errors;
                    reject(this.errors);
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
    async loadMany(relationNames, forceReload = true) {
        const promises = [];
        for (const relation in relationNames) {
            promises.push(this.load(relationNames[relation], forceReload));
        }
        await Promise.all(promises);
    }
    async load(relationName, forceReload = true) {
        var _a;
        let found = false;
        const anyThis = this;
        const relations = relationName.split('.');
        relationName = relations.reverse().pop();
        let loadedProperty = relationName;
        const prototype = Object.getPrototypeOf(this);
        const relationData = (_a = prototype.relations) !== null && _a !== void 0 ? _a : {};
        const relationKeys = Object.keys(relationData);
        if (!this.relationsLoaded.includes(relationName) || forceReload) {
            const routeParams = this.getRouteParameterMapping();
            for (const propertyKey in this) {
                if (relationKeys.includes(propertyKey)) {
                    const options = relationData[propertyKey];
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
                            if (Array.isArray(anyThis[propertyKey]) || anyThis[propertyKey] === undefined || anyThis[propertyKey] === null) {
                                anyThis[propertyKey] = await repository.loadMany((hasManyOptions.mapIds ? hasManyOptions.mapIds(this) : anyThis[hasManyOptions.relatedIds]), routeParams);
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
                        else if (options.type === 'hasCollection') {
                            //TODO an option where the related data can be 'paginated'
                            //check if property is array, then load the subcollection into it
                            if (Array.isArray(anyThis[propertyKey]) || anyThis[propertyKey] === undefined || anyThis[propertyKey] === null) {
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
                            const hasOneOptions = options;
                            //load data into the 'propertyKey' property of the model, while load the model with the id from the 'relatedId' property
                            anyThis[propertyKey] = await repository.load(this[hasOneOptions.relatedId], routeParams);
                            if (hasOneOptions.foreignProperty) {
                                anyThis[propertyKey][hasOneOptions.foreignProperty] = this;
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
            if (Array.isArray(anyThis[loadedProperty])) {
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
        const prototype = Object.getPrototypeOf(this);
        const options = prototype.collection;
        if (!options || !options.route) {
            throw new Error(`Class ${this.constructor.name} doesn't have a route parameter on the @Collection annotation`);
        }
        return options.route;
    }
    getRouteParameterMapping() {
        var _a, _b;
        const searchRegex = /{([^}]+)}/g;
        const prototype = Object.getPrototypeOf(this);
        const fieldData = (_a = prototype.fields) !== null && _a !== void 0 ? _a : {};
        const fieldKeys = Object.keys(fieldData);
        if (prototype.collection) {
            const options = prototype.collection;
            if (!options || !options.route) {
                throw new Error(`Class ${this.constructor.name} doesn't have a route parameter on the @Collection annotation`);
            }
            //TODO have a look at the workings of this getROuteParameter because there are some strange things involved
            //get every param which has been annotated in the model with 'routeParam: true'
            const paramsObject = {};
            for (const propertyKey in this) {
                if (fieldKeys.includes(propertyKey)) {
                    const options = fieldData[propertyKey];
                    if (options.routeParam) {
                        paramsObject[(_b = options.name) !== null && _b !== void 0 ? _b : propertyKey] = this[propertyKey];
                    }
                }
            }
            // const pathTemplate = options.route
            // const params = searchRegex.exec(pathTemplate)
            // // const returnParams: string[] = []
            // //if has route param
            // if(params){
            //   //check to see if route param is a property of the model and it is set
            //   params.forEach((param) => {
            //     const paramStrip = param.replace(/[{}]/g, '')
            //     if(!paramsObject[paramStrip]){
            //       throw new Error(`Required route param ${paramStrip} is not set on the class ${this.constructor.name}`)
            //     }
            //     // if(!returnParams.includes(paramStrip)) returnParams.push(paramStrip)
            //   })
            // }
            return paramsObject;
        }
        else {
            throw new Error(`Class ${this.constructor.name} is not annotated with @Collection`);
        }
    }
    toJson(toFireJson = false) {
        this.reset();
        return this.innerToJson(toFireJson);
    }
    innerToJson(toFireJson) {
        var _a, _b, _c, _d, _e;
        const json = {};
        const relationData = (_a = Object.getPrototypeOf(this).relations) !== null && _a !== void 0 ? _a : {};
        const fieldData = (_b = Object.getPrototypeOf(this).fields) !== null && _b !== void 0 ? _b : {};
        const fieldKeys = Object.keys(fieldData);
        for (const propertyKey in this) {
            // if property has field metadata, then we must convert into json
            if (fieldKeys.includes(propertyKey) || !toFireJson) {
                const options = (_c = fieldData[propertyKey]) !== null && _c !== void 0 ? _c : null;
                const relationOption = (_d = relationData[propertyKey]) !== null && _d !== void 0 ? _d : null;
                const jsonPropertyKey = (_e = options.name) !== null && _e !== void 0 ? _e : propertyKey;
                if (this[propertyKey] !== undefined) {
                    if ((options === null || options === void 0 ? void 0 : options.modelClass) || ((relationOption === null || relationOption === void 0 ? void 0 : relationOption.modelClass) && !toFireJson)) {
                        if (Array.isArray(this[propertyKey])) {
                            json[jsonPropertyKey] = [];
                            this[propertyKey].forEach((value) => {
                                json[jsonPropertyKey].push(this.convertFromInstance(value, toFireJson));
                            });
                        }
                        else {
                            json[jsonPropertyKey] = this.convertFromInstance(this[propertyKey], toFireJson);
                        }
                        // if the property is a model, then we must convert into json
                    }
                    else {
                        if (options === null || options === void 0 ? void 0 : options.timestamp) {
                            if (toFireJson) {
                                json[jsonPropertyKey] = (0, engine_1.useEngine)().convertToTimestamp(this[propertyKey]);
                            }
                            else {
                                json[jsonPropertyKey] = this[propertyKey];
                            }
                        }
                        else {
                            json[jsonPropertyKey] = this[propertyKey];
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
    convertFromInstance(data, toFireJson) {
        if (data instanceof Model) {
            return data.innerFromJson(data, toFireJson);
        }
        else {
            return (0, class_transformer_1.instanceToPlain)(data, { enableCircularCheck: true });
        }
    }
    fromJson(data, fromFireJson = false) {
        this.innerFromJson(data, fromFireJson);
        this.init();
        return this;
    }
    innerFromJson(data, fromFireJson) {
        var _a, _b, _c, _d, _e, _f;
        let anyThis = this;
        const fieldData = (_a = Object.getPrototypeOf(this).fields) !== null && _a !== void 0 ? _a : {};
        const relationData = (_b = Object.getPrototypeOf(this).relations) !== null && _b !== void 0 ? _b : {};
        for (const propertyKey in data) {
            const options = (_c = fieldData[propertyKey]) !== null && _c !== void 0 ? _c : null;
            const relationOption = (_d = relationData[propertyKey]) !== null && _d !== void 0 ? _d : null;
            const jsonPropertyKey = (_e = options === null || options === void 0 ? void 0 : options.name) !== null && _e !== void 0 ? _e : propertyKey;
            if (data[jsonPropertyKey]) {
                if ((options === null || options === void 0 ? void 0 : options.modelClass) || ((relationOption === null || relationOption === void 0 ? void 0 : relationOption.modelClass) && !fromFireJson)) {
                    if (Array.isArray(data[jsonPropertyKey])) {
                        anyThis[jsonPropertyKey] = new Array();
                        data[jsonPropertyKey].forEach((value) => {
                            var _a;
                            anyThis[jsonPropertyKey].push(this.convertToInstance((_a = relationOption === null || relationOption === void 0 ? void 0 : relationOption.modelClass) !== null && _a !== void 0 ? _a : options.modelClass, value, fromFireJson));
                        });
                    }
                    else {
                        anyThis[jsonPropertyKey] = this.convertToInstance((_f = relationOption === null || relationOption === void 0 ? void 0 : relationOption.modelClass) !== null && _f !== void 0 ? _f : options.modelClass, data[jsonPropertyKey], fromFireJson);
                    }
                }
                else {
                    if (options === null || options === void 0 ? void 0 : options.timestamp) {
                        if (fromFireJson) {
                            anyThis[propertyKey] = (0, engine_1.useEngine)().convertFromTimestamp(data[jsonPropertyKey]);
                        }
                        else {
                            anyThis[propertyKey] = data[jsonPropertyKey];
                        }
                    }
                    else {
                        anyThis[propertyKey] = data[jsonPropertyKey];
                    }
                }
            }
        }
        this.id = data.id;
        return this;
    }
    convertToInstance(modelClass, data, fromFireJson) {
        if (modelClass.prototype instanceof Model) {
            return (new modelClass()).innerFromJson(data, fromFireJson);
        }
        else {
            return (0, class_transformer_1.plainToInstance)(modelClass, data, { enableCircularCheck: true });
        }
    }
}
__decorate([
    (0, __1.Field)(),
    __metadata("design:type", String)
], Model.prototype, "id", void 0);
exports.default = Model;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbW9kZWxzL01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsOERBQStDO0FBRS9DLHNDQUFzQztBQUN0QyxrREFBbUQ7QUFLbkQsMkNBQXdDO0FBQ3hDLDBCQUEyQjtBQUMzQix5REFBcUU7QUFTckUsdUZBQXVGO0FBRXZGLE1BQThCLEtBQUs7SUFNL0IsWUFBWSxHQUFHLENBQVE7UUFKdkIsT0FBRSxHQUFZLElBQUksQ0FBQTtRQUVsQixvQkFBZSxHQUFhLEVBQUUsQ0FBQTtRQU90QixXQUFNLEdBQVcsSUFBSSxDQUFBO0lBTEgsQ0FBQztJQUUzQixJQUFJLENBQUMsR0FBRyxDQUFRLElBQVUsT0FBTSxDQUFDLENBQUM7SUFDbEMsS0FBSyxLQUFXLE9BQU0sQ0FBQyxDQUFDO0lBTWhCLFlBQVk7O1FBRWxCLE1BQU0sU0FBUyxHQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUF1QixDQUFBO1FBQ3BFLE1BQU0sUUFBUSxHQUFHLE1BQUEsU0FBUyxDQUFDLEtBQUssbUNBQUksRUFBRSxDQUFBO1FBQ3RDLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7UUFFdEMsSUFBSSxLQUFLLEdBQW9CLEVBQUUsQ0FBQTtRQUMvQixLQUFJLE1BQU0sV0FBVyxJQUFJLElBQUksRUFBQztZQUM1Qiw2Q0FBNkM7WUFDN0MsSUFBRyxRQUFRLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFDO2dCQUNoQyxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFzQixDQUFBO2dCQUV2RCxJQUFHLElBQUksWUFBWSxRQUFRLEVBQUM7b0JBQzFCLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBb0IsQ0FBQyxDQUFDLENBQUE7aUJBQ3pEO3FCQUFN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LEVBQUUsQ0FBVyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFpQixDQUFBO1NBQ3ZGO2FBQU07WUFDTCxPQUFPLElBQUEsbUNBQWUsRUFBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEVBQUMsbUJBQW1CLEVBQUUsSUFBSSxFQUFDLENBQU0sQ0FBQTtTQUMzRTtJQUNILENBQUM7Q0FDSjtBQXBWRztJQURDLElBQUEsU0FBSyxHQUFFOztpQ0FDVTtBQUZ0Qix3QkFzVkMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuaW1wb3J0IFZhbGlkYXRvciwgeyBFcnJvcnMgfSBmcm9tIFwidmFsaWRhdG9yanNcIlxyXG5pbXBvcnQgUmVwb3NpdG9yeSBmcm9tIFwifi9yZXBvc2l0b3JpZXMvUmVwb3NpdG9yeVwiO1xyXG5pbXBvcnQgeyB1c2VFbmdpbmUgfSBmcm9tIFwiLi4vZW5naW5lXCI7XHJcbmltcG9ydCB7IGdldFJlcG9zaXRvcnlGb3IgfSBmcm9tIFwiLi4vcmVwb3NpdG9yaWVzXCI7XHJcbmltcG9ydCB7IEhhc01hbnlSZWxhdGlvbkNvbmZpZywgSGFzT25lUmVsYXRpb25Db25maWcsIFJlbGF0aW9uQ29uZmlnLCBSZWxhdGlvbkNvbmZpZ1dpdGhUeXBlIH0gZnJvbSBcIi4uL3R5cGVzL2NvbmZpZ3MvUmVsYXRpb25Db25maWdcIjtcclxuaW1wb3J0IHsgQ29uc3RydWN0b3JGdW5jdGlvbiB9IGZyb20gXCIuLi90eXBlcy9mdW5jdGlvbnMvQ29uc3RydWN0b3JGdW5jdGlvblwiO1xyXG5pbXBvcnQgeyBGaWVsZENvbmZpZyB9IGZyb20gXCIuLi90eXBlcy9jb25maWdzL0ZpZWxkQ29uZmlnXCI7XHJcbmltcG9ydCB7IFZhbGlkYXRlQ29uZmlnIH0gZnJvbSBcIi4uL3R5cGVzL2NvbmZpZ3MvVmFsaWRhdGVDb25maWdcIjtcclxuaW1wb3J0IHsgQmx1ZXByaW50IH0gZnJvbSBcIi4vQmx1ZXByaW50XCI7XHJcbmltcG9ydCB7IEZpZWxkIH0gZnJvbSBcIi4uXCI7XHJcbmltcG9ydCB7IGluc3RhbmNlVG9QbGFpbiwgcGxhaW5Ub0luc3RhbmNlIH0gZnJvbSBcImNsYXNzLXRyYW5zZm9ybWVyXCI7XHJcbmltcG9ydCB7IENsYXNzV2l0aEZpZWxkcyB9IGZyb20gXCJ+L3R5cGVzL2ludGVybmFsL0NsYXNzV2l0aEZpZWxkc1wiO1xyXG5pbXBvcnQgeyBDbGFzc1dpdGhDb2xsZWN0aW9uIH0gZnJvbSBcIn4vdHlwZXMvaW50ZXJuYWwvQ2xhc3NXaXRoQ29sbGVjdGlvblwiO1xyXG5pbXBvcnQgeyBDbGFzc1dpdGhSZWxhdGlvbnMgfSBmcm9tIFwifi90eXBlcy9pbnRlcm5hbC9DbGFzc1dpdGhSZWxhdGlvbnNcIjtcclxuaW1wb3J0IHsgQ2xhc3NXaXRoUnVsZXMgfSBmcm9tIFwifi90eXBlcy9pbnRlcm5hbC9DbGFzc1dpdGhSdWxlc1wiO1xyXG5cclxuXHJcbmV4cG9ydCB0eXBlIFBhcmFtc09iamVjdCA9IHsgW2tleTogc3RyaW5nXTogYW55IH07XHJcblxyXG4vL1RPRE8gZXZlbnRzIGJlZm9yZSBkZWxldGUsIGFmdGVyIGRlbGV0LCBiZWZvcmUgbG9hZCwgYmVmb3JlLWFmdGVyIHNhdmUsIHVwZGF0ZSBldGMuLi5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFic3RyYWN0IGNsYXNzIE1vZGVsIHtcclxuICAgIEBGaWVsZCgpXHJcbiAgICBpZD86IHN0cmluZyA9IG51bGxcclxuXHJcbiAgICByZWxhdGlvbnNMb2FkZWQ6IHN0cmluZ1tdID0gW11cclxuXHJcbiAgICBjb25zdHJ1Y3RvciguLi5fOiBhbnlbXSkge31cclxuXHJcbiAgICBpbml0KC4uLl86IGFueVtdKTogdm9pZCB7IHJldHVybiB9XHJcbiAgICByZXNldCgpOiB2b2lkIHsgcmV0dXJuIH1cclxuXHJcbiAgICBwcml2YXRlIGVycm9yczogRXJyb3JzID0gbnVsbFxyXG5cclxuICAgIGFic3RyYWN0IGdldE1vZGVsTmFtZSgpOiBzdHJpbmdcclxuXHJcbiAgICBwcml2YXRlIGNvbGxlY3RSdWxlczxUPigpOiBWYWxpZGF0b3IuUnVsZXMge1xyXG4gICAgICBcclxuICAgICAgY29uc3QgcHJvdG90eXBlID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhSdWxlczxUPilcclxuICAgICAgY29uc3QgcnVsZURhdGEgPSBwcm90b3R5cGUucnVsZXMgPz8ge31cclxuICAgICAgY29uc3QgcnVsZUtleXMgPSBPYmplY3Qua2V5cyhydWxlRGF0YSlcclxuXHJcbiAgICAgIGxldCBydWxlczogVmFsaWRhdG9yLlJ1bGVzID0ge31cclxuICAgICAgZm9yKGNvbnN0IHByb3BlcnR5S2V5IGluIHRoaXMpe1xyXG4gICAgICAgIC8vVE9ETyByZWN1cnNpdmUgdmFsaWRhdGlvbiBvbiByZWxhdGVkIG1vZGVsc1xyXG4gICAgICAgIGlmKHJ1bGVLZXlzLmluY2x1ZGVzKHByb3BlcnR5S2V5KSl7XHJcbiAgICAgICAgICBjb25zdCBydWxlID0gcnVsZURhdGFbcHJvcGVydHlLZXldIGFzIFZhbGlkYXRlQ29uZmlnPFQ+XHJcblxyXG4gICAgICAgICAgaWYocnVsZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKXtcclxuICAgICAgICAgICAgcnVsZXMgPSBPYmplY3QuYXNzaWduKHJ1bGVzLCBydWxlKHRoaXMgYXMgdW5rbm93biBhcyBUKSlcclxuICAgICAgICAgIH0gZWxzZSBpZihydWxlIGluc3RhbmNlb2YgT2JqZWN0KXtcclxuICAgICAgICAgICAgcnVsZXMgPSBPYmplY3QuYXNzaWduKHJ1bGVzLCBydWxlKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcnVsZXNbcHJvcGVydHlLZXldID0gcnVsZVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcnVsZXNcclxuICAgIH1cclxuXHJcbiAgICB2YWxpZGF0ZSAoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgcnVsZXMgPSB0aGlzLmNvbGxlY3RSdWxlcygpXHJcbiAgICAgICAgbGV0IHZhbGlkYXRvciA9IG5ldyBWYWxpZGF0b3IodGhpcyBhcyBhbnksIHJ1bGVzKVxyXG5cclxuICAgICAgICBpZiAodmFsaWRhdG9yLmhhc0FzeW5jKSB7XHJcbiAgICAgICAgICB2YWxpZGF0b3IuY2hlY2tBc3luYyhyZXNvbHZlLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzID0gdmFsaWRhdG9yLmVycm9yc1xyXG4gICAgICAgICAgICByZWplY3QodGhpcy5lcnJvcnMpXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAodmFsaWRhdG9yLmNoZWNrKCkpIHtcclxuICAgICAgICAgICAgcmVzb2x2ZSgpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmVycm9ycyA9IHZhbGlkYXRvci5lcnJvcnNcclxuICAgICAgICAgICAgcmVqZWN0KHRoaXMuZXJyb3JzKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBoYXNFcnJvcnMgKCk6IGJvb2xlYW4ge1xyXG4gICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5lcnJvcnMgPz8ge30pLmxlbmd0aCA+IDBcclxuICAgIH1cclxuXHJcbiAgICBnZXRBbGxFcnJvcnMgKCk6IFZhbGlkYXRvci5WYWxpZGF0aW9uRXJyb3JzIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZXJyb3JzPy5hbGwoKVxyXG4gICAgfVxyXG5cclxuICAgIGdldEVycm9ycyAobmFtZTogc3RyaW5nKTogQXJyYXk8c3RyaW5nPiB8IGZhbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZXJyb3JzPy5nZXQobmFtZSlcclxuICAgIH1cclxuXHJcbiAgICBnZXRFcnJvciAobmFtZTogc3RyaW5nKTogc3RyaW5nIHwgZmFsc2Uge1xyXG4gICAgICByZXR1cm4gdGhpcy5lcnJvcnM/LmZpcnN0KG5hbWUpXHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgbG9hZE1hbnkocmVsYXRpb25OYW1lczogc3RyaW5nW10sIGZvcmNlUmVsb2FkOiBib29sZWFuID0gdHJ1ZSk6IFByb21pc2U8dm9pZD57XHJcbiAgICAgIGNvbnN0IHByb21pc2VzID0gW11cclxuICAgICAgZm9yKGNvbnN0IHJlbGF0aW9uIGluIHJlbGF0aW9uTmFtZXMpe1xyXG4gICAgICAgIHByb21pc2VzLnB1c2godGhpcy5sb2FkKHJlbGF0aW9uTmFtZXNbcmVsYXRpb25dLCBmb3JjZVJlbG9hZCkpXHJcbiAgICAgIH1cclxuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpXHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgbG9hZChyZWxhdGlvbk5hbWU6IHN0cmluZywgZm9yY2VSZWxvYWQ6IGJvb2xlYW4gPSB0cnVlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgIGxldCBmb3VuZCA9IGZhbHNlXHJcbiAgICAgIGNvbnN0IGFueVRoaXMgPSB0aGlzIGFzIGFueVxyXG5cclxuICAgICAgY29uc3QgcmVsYXRpb25zID0gcmVsYXRpb25OYW1lLnNwbGl0KCcuJylcclxuICAgICAgcmVsYXRpb25OYW1lID0gcmVsYXRpb25zLnJldmVyc2UoKS5wb3AoKVxyXG5cclxuICAgICAgbGV0IGxvYWRlZFByb3BlcnR5ID0gcmVsYXRpb25OYW1lXHJcblxyXG4gICAgICBjb25zdCBwcm90b3R5cGUgPSAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpIGFzIENsYXNzV2l0aFJlbGF0aW9ucylcclxuICAgICAgY29uc3QgcmVsYXRpb25EYXRhID0gcHJvdG90eXBlLnJlbGF0aW9ucyA/PyB7fVxyXG4gICAgICBjb25zdCByZWxhdGlvbktleXMgPSBPYmplY3Qua2V5cyhyZWxhdGlvbkRhdGEpXHJcbiAgICAgIFxyXG4gICAgICBpZighdGhpcy5yZWxhdGlvbnNMb2FkZWQuaW5jbHVkZXMocmVsYXRpb25OYW1lKSB8fCBmb3JjZVJlbG9hZCl7XHJcbiAgICAgICAgY29uc3Qgcm91dGVQYXJhbXMgPSB0aGlzLmdldFJvdXRlUGFyYW1ldGVyTWFwcGluZygpXHJcbiAgICAgICAgZm9yKGNvbnN0IHByb3BlcnR5S2V5IGluIHRoaXMpIHtcclxuICAgICAgICAgIGlmKHJlbGF0aW9uS2V5cy5pbmNsdWRlcyhwcm9wZXJ0eUtleSkpe1xyXG4gICAgICAgICAgICBjb25zdCBvcHRpb25zID0gcmVsYXRpb25EYXRhW3Byb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICAvL2dldCB0aGUgcmVwb3NpdG9yeSBmb3IgdGhlIGN1cnJlbnQgbW9kZWxDbGFzc1xyXG4gICAgICAgICAgICBjb25zdCByZXBvc2l0b3J5ID0gZ2V0UmVwb3NpdG9yeUZvcihvcHRpb25zLm1vZGVsQ2xhc3MgYXMgQ29uc3RydWN0b3JGdW5jdGlvbjxNb2RlbD4pIGFzIFJlcG9zaXRvcnk8TW9kZWw+XHJcbiAgICAgICAgICAgIGlmKChvcHRpb25zLm5hbWUgJiYgb3B0aW9ucy5uYW1lID09PSByZWxhdGlvbk5hbWUpIHx8IHByb3BlcnR5S2V5ID09PSByZWxhdGlvbk5hbWUpIHtcclxuICAgICAgICAgICAgICBsb2FkZWRQcm9wZXJ0eSA9IHByb3BlcnR5S2V5XHJcbiAgICAgICAgICAgICAgZm91bmQgPSB0cnVlXHJcbiAgICAgICAgICAgICAgaWYob3B0aW9ucy50eXBlID09PSAnaGFzTWFueScpe1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaGFzTWFueU9wdGlvbnMgPSBvcHRpb25zIGFzIEhhc01hbnlSZWxhdGlvbkNvbmZpZ1xyXG4gICAgICAgICAgICAgICAgaWYoIWhhc01hbnlPcHRpb25zLm1hcElkcyAmJiAhaGFzTWFueU9wdGlvbnMucmVsYXRlZElkcyl7XHJcbiAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQEhhc01hbnkgcmVsYXRpb24gJHtyZWxhdGlvbk5hbWV9IG9uICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBpcyBtaXNzaW5nICdtYXBJZHMnIGFuZCAncmVsYXRlZElkcycuIE9uZSBvZiB0aGVtIG11c3QgYmUgZGVmaW5lZC5gKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheShhbnlUaGlzW3Byb3BlcnR5S2V5XSkgfHwgYW55VGhpc1twcm9wZXJ0eUtleV0gPT09IHVuZGVmaW5lZCB8fCBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IGF3YWl0IHJlcG9zaXRvcnkubG9hZE1hbnkoKGhhc01hbnlPcHRpb25zLm1hcElkcyA/IGhhc01hbnlPcHRpb25zLm1hcElkcyh0aGlzKSA6IGFueVRoaXNbaGFzTWFueU9wdGlvbnMucmVsYXRlZElkc10pLCByb3V0ZVBhcmFtcylcclxuICAgICAgICAgICAgICAgICAgaWYob3B0aW9ucy5mb3JlaWduUHJvcGVydHkpe1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcihjb25zdCBpbmRleCBpbiBhbnlUaGlzW3Byb3BlcnR5S2V5XSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XVtpbmRleF1bb3B0aW9ucy5mb3JlaWduUHJvcGVydHldID0gdGhpc1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZWxhdGlvbiAke3JlbGF0aW9uTmFtZX0gd2l0aCAnJHtvcHRpb25zLnR5cGV9JyBvbiAke3Byb3BlcnR5S2V5fSBwcm9wZXJ0eSBpcyBub3QgYW4gYXJyYXlgKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZihvcHRpb25zLnR5cGUgPT09ICdoYXNDb2xsZWN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgLy9UT0RPIGFuIG9wdGlvbiB3aGVyZSB0aGUgcmVsYXRlZCBkYXRhIGNhbiBiZSAncGFnaW5hdGVkJ1xyXG4gICAgICAgICAgICAgICAgLy9jaGVjayBpZiBwcm9wZXJ0eSBpcyBhcnJheSwgdGhlbiBsb2FkIHRoZSBzdWJjb2xsZWN0aW9uIGludG8gaXRcclxuICAgICAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkoYW55VGhpc1twcm9wZXJ0eUtleV0pIHx8IGFueVRoaXNbcHJvcGVydHlLZXldID09PSB1bmRlZmluZWQgfHwgYW55VGhpc1twcm9wZXJ0eUtleV0gPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSBhd2FpdCByZXBvc2l0b3J5LmxvYWRDb2xsZWN0aW9uKHJvdXRlUGFyYW1zKVxyXG4gICAgICAgICAgICAgICAgICBpZihvcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eSl7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yKGNvbnN0IGluZGV4IGluIGFueVRoaXNbcHJvcGVydHlLZXldKXtcclxuICAgICAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldW2luZGV4XVtvcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eV0gPSB0aGlzXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFJlbGF0aW9uICR7cmVsYXRpb25OYW1lfSB3aXRoICcke29wdGlvbnMudHlwZX0nIG9uICR7cHJvcGVydHlLZXl9IHByb3BlcnR5IGlzIG5vdCBhbiBhcnJheWApXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhhc09uZU9wdGlvbnMgPSBvcHRpb25zIGFzIEhhc09uZVJlbGF0aW9uQ29uZmlnXHJcbiAgICAgICAgICAgICAgICAvL2xvYWQgZGF0YSBpbnRvIHRoZSAncHJvcGVydHlLZXknIHByb3BlcnR5IG9mIHRoZSBtb2RlbCwgd2hpbGUgbG9hZCB0aGUgbW9kZWwgd2l0aCB0aGUgaWQgZnJvbSB0aGUgJ3JlbGF0ZWRJZCcgcHJvcGVydHlcclxuICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gYXdhaXQgcmVwb3NpdG9yeS5sb2FkKCh0aGlzIGFzIGFueSlbaGFzT25lT3B0aW9ucy5yZWxhdGVkSWRdLCByb3V0ZVBhcmFtcylcclxuICAgICAgICAgICAgICAgIGlmKGhhc09uZU9wdGlvbnMuZm9yZWlnblByb3BlcnR5KXtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV1baGFzT25lT3B0aW9ucy5mb3JlaWduUHJvcGVydHldID0gdGhpc1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgXHJcbiAgICAgICAgaWYoIWZvdW5kKXtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUmVsYXRpb24gJHtyZWxhdGlvbk5hbWV9IG5vdCBmb3VuZCBvbiAke3RoaXMuY29uc3RydWN0b3IubmFtZX1gKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnJlbGF0aW9uc0xvYWRlZC5wdXNoKHJlbGF0aW9uTmFtZSlcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYocmVsYXRpb25zLmxlbmd0aCA+IDApe1xyXG4gICAgICAgIC8vcmV2ZXJzZSBiYWNrIHRoZSBhcnJheSBcclxuICAgICAgICByZWxhdGlvbnMucmV2ZXJzZSgpXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShhbnlUaGlzW2xvYWRlZFByb3BlcnR5XSkpe1xyXG4gICAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXVxyXG4gICAgICAgICAgZm9yKGNvbnN0IGluZGV4IGluIGFueVRoaXNbbG9hZGVkUHJvcGVydHldKXtcclxuICAgICAgICAgICAgcHJvbWlzZXMucHVzaChhbnlUaGlzW2xvYWRlZFByb3BlcnR5XVtpbmRleF0ubG9hZChyZWxhdGlvbnMuam9pbignLicpKSlcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBhd2FpdCBhbnlUaGlzW2xvYWRlZFByb3BlcnR5XS5sb2FkKHJlbGF0aW9ucy5qb2luKCcuJykpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Qmx1ZXByaW50PFQgZXh0ZW5kcyBNb2RlbD4odGhpczogVCk6IEJsdWVwcmludDxUPiB7XHJcbiAgICAgIHJldHVybiBuZXcgQmx1ZXByaW50KHRoaXMsIHRoaXMuZ2V0Um91dGVQYXJhbWV0ZXJNYXBwaW5nKCkpXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Um91dGUoKTogc3RyaW5nIHtcclxuICAgICAgY29uc3QgcHJvdG90eXBlID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhDb2xsZWN0aW9uKVxyXG4gICAgICBjb25zdCBvcHRpb25zID0gcHJvdG90eXBlLmNvbGxlY3Rpb25cclxuICAgICAgaWYoIW9wdGlvbnMgfHwgIW9wdGlvbnMucm91dGUpe1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2xhc3MgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXNuJ3QgaGF2ZSBhIHJvdXRlIHBhcmFtZXRlciBvbiB0aGUgQENvbGxlY3Rpb24gYW5ub3RhdGlvbmApXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG9wdGlvbnMucm91dGVcclxuICAgIH1cclxuXHJcbiAgICBnZXRSb3V0ZVBhcmFtZXRlck1hcHBpbmcoKTogUGFyYW1zT2JqZWN0IHtcclxuICAgICAgY29uc3Qgc2VhcmNoUmVnZXggPSAveyhbXn1dKyl9L2dcclxuICAgICAgY29uc3QgcHJvdG90eXBlID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhGaWVsZHMgJiBDbGFzc1dpdGhDb2xsZWN0aW9uKVxyXG4gICAgICBjb25zdCBmaWVsZERhdGEgPSBwcm90b3R5cGUuZmllbGRzID8/IHt9XHJcbiAgICAgIGNvbnN0IGZpZWxkS2V5cyA9IE9iamVjdC5rZXlzKGZpZWxkRGF0YSlcclxuICAgICAgaWYocHJvdG90eXBlLmNvbGxlY3Rpb24pIHtcclxuICAgICAgICBjb25zdCBvcHRpb25zID0gcHJvdG90eXBlLmNvbGxlY3Rpb25cclxuICAgICAgICBpZighb3B0aW9ucyB8fCAhb3B0aW9ucy5yb3V0ZSl7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBkb2Vzbid0IGhhdmUgYSByb3V0ZSBwYXJhbWV0ZXIgb24gdGhlIEBDb2xsZWN0aW9uIGFubm90YXRpb25gKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9UT0RPIGhhdmUgYSBsb29rIGF0IHRoZSB3b3JraW5ncyBvZiB0aGlzIGdldFJPdXRlUGFyYW1ldGVyIGJlY2F1c2UgdGhlcmUgYXJlIHNvbWUgc3RyYW5nZSB0aGluZ3MgaW52b2x2ZWRcclxuICAgICAgICAvL2dldCBldmVyeSBwYXJhbSB3aGljaCBoYXMgYmVlbiBhbm5vdGF0ZWQgaW4gdGhlIG1vZGVsIHdpdGggJ3JvdXRlUGFyYW06IHRydWUnXHJcbiAgICAgICAgY29uc3QgcGFyYW1zT2JqZWN0OiBQYXJhbXNPYmplY3QgPSB7fVxyXG4gICAgICAgIFxyXG4gICAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiB0aGlzKSB7XHJcbiAgICAgICAgICBpZihmaWVsZEtleXMuaW5jbHVkZXMocHJvcGVydHlLZXkpKXtcclxuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGZpZWxkRGF0YVtwcm9wZXJ0eUtleV1cclxuXHJcbiAgICAgICAgICAgIGlmKG9wdGlvbnMucm91dGVQYXJhbSl7XHJcbiAgICAgICAgICAgICAgcGFyYW1zT2JqZWN0W29wdGlvbnMubmFtZSA/PyBwcm9wZXJ0eUtleV0gPSB0aGlzW3Byb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBjb25zdCBwYXRoVGVtcGxhdGUgPSBvcHRpb25zLnJvdXRlXHJcbiAgICAgICAgLy8gY29uc3QgcGFyYW1zID0gc2VhcmNoUmVnZXguZXhlYyhwYXRoVGVtcGxhdGUpXHJcblxyXG4gICAgICAgIC8vIC8vIGNvbnN0IHJldHVyblBhcmFtczogc3RyaW5nW10gPSBbXVxyXG4gICAgICAgIC8vIC8vaWYgaGFzIHJvdXRlIHBhcmFtXHJcbiAgICAgICAgLy8gaWYocGFyYW1zKXtcclxuICAgICAgICAvLyAgIC8vY2hlY2sgdG8gc2VlIGlmIHJvdXRlIHBhcmFtIGlzIGEgcHJvcGVydHkgb2YgdGhlIG1vZGVsIGFuZCBpdCBpcyBzZXRcclxuICAgICAgICAvLyAgIHBhcmFtcy5mb3JFYWNoKChwYXJhbSkgPT4ge1xyXG4gICAgICAgIC8vICAgICBjb25zdCBwYXJhbVN0cmlwID0gcGFyYW0ucmVwbGFjZSgvW3t9XS9nLCAnJylcclxuICAgICAgICAvLyAgICAgaWYoIXBhcmFtc09iamVjdFtwYXJhbVN0cmlwXSl7XHJcbiAgICAgICAgLy8gICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZXF1aXJlZCByb3V0ZSBwYXJhbSAke3BhcmFtU3RyaXB9IGlzIG5vdCBzZXQgb24gdGhlIGNsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfWApXHJcbiAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAvLyAgICAgLy8gaWYoIXJldHVyblBhcmFtcy5pbmNsdWRlcyhwYXJhbVN0cmlwKSkgcmV0dXJuUGFyYW1zLnB1c2gocGFyYW1TdHJpcClcclxuICAgICAgICAvLyAgIH0pXHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICByZXR1cm4gcGFyYW1zT2JqZWN0XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2xhc3MgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9IGlzIG5vdCBhbm5vdGF0ZWQgd2l0aCBAQ29sbGVjdGlvbmApXHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgdG9Kc29uKHRvRmlyZUpzb246IGJvb2xlYW4gPSBmYWxzZSk6IGFueSB7XHJcbiAgICAgIHRoaXMucmVzZXQoKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuaW5uZXJUb0pzb24odG9GaXJlSnNvbilcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGlubmVyVG9Kc29uKHRvRmlyZUpzb246IGJvb2xlYW4pOiBhbnkge1xyXG4gICAgICBjb25zdCBqc29uOiBhbnkgPSB7fVxyXG5cclxuICAgICAgY29uc3QgcmVsYXRpb25EYXRhID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhSZWxhdGlvbnMpLnJlbGF0aW9ucyA/PyB7fVxyXG4gICAgICBjb25zdCBmaWVsZERhdGEgPSAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpIGFzIENsYXNzV2l0aEZpZWxkcykuZmllbGRzID8/IHt9XHJcbiAgICAgIGNvbnN0IGZpZWxkS2V5cyA9IE9iamVjdC5rZXlzKGZpZWxkRGF0YSlcclxuXHJcbiAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiB0aGlzKSB7XHJcbiAgICAgICAgLy8gaWYgcHJvcGVydHkgaGFzIGZpZWxkIG1ldGFkYXRhLCB0aGVuIHdlIG11c3QgY29udmVydCBpbnRvIGpzb25cclxuICAgICAgICBpZihmaWVsZEtleXMuaW5jbHVkZXMocHJvcGVydHlLZXkpIHx8ICF0b0ZpcmVKc29uKXtcclxuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBmaWVsZERhdGFbcHJvcGVydHlLZXldIGFzIEZpZWxkQ29uZmlnID8/IG51bGxcclxuICAgICAgICAgIGNvbnN0IHJlbGF0aW9uT3B0aW9uID0gcmVsYXRpb25EYXRhW3Byb3BlcnR5S2V5XSBhcyBSZWxhdGlvbkNvbmZpZyA/PyBudWxsXHJcbiAgICAgICAgICBjb25zdCBqc29uUHJvcGVydHlLZXkgPSBvcHRpb25zLm5hbWUgPz8gcHJvcGVydHlLZXlcclxuICAgICAgICAgIGlmKHRoaXNbcHJvcGVydHlLZXldICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICBpZihvcHRpb25zPy5tb2RlbENsYXNzIHx8IChyZWxhdGlvbk9wdGlvbj8ubW9kZWxDbGFzcyAmJiAhdG9GaXJlSnNvbikpIHtcclxuICAgICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KHRoaXNbcHJvcGVydHlLZXldKSl7XHJcbiAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSBbXVxyXG4gICAgICAgICAgICAgICAgOyh0aGlzW3Byb3BlcnR5S2V5XSBhcyB1bmtub3duIGFzIEFycmF5PGFueT4pLmZvckVhY2goKHZhbHVlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldLnB1c2godGhpcy5jb252ZXJ0RnJvbUluc3RhbmNlKHZhbHVlLCB0b0ZpcmVKc29uKSlcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IHRoaXMuY29udmVydEZyb21JbnN0YW5jZSh0aGlzW3Byb3BlcnR5S2V5XSwgdG9GaXJlSnNvbilcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgLy8gaWYgdGhlIHByb3BlcnR5IGlzIGEgbW9kZWwsIHRoZW4gd2UgbXVzdCBjb252ZXJ0IGludG8ganNvblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGlmKG9wdGlvbnM/LnRpbWVzdGFtcCkge1xyXG4gICAgICAgICAgICAgICAgaWYodG9GaXJlSnNvbil7XHJcbiAgICAgICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IHVzZUVuZ2luZSgpLmNvbnZlcnRUb1RpbWVzdGFtcCgodGhpc1twcm9wZXJ0eUtleV0gYXMgYW55KSlcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IHRoaXNbcHJvcGVydHlLZXldXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IHRoaXNbcHJvcGVydHlLZXldXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSBudWxsXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGpzb24uaWQgPSB0aGlzLmlkXHJcbiAgICAgIHJldHVybiBqc29uXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjb252ZXJ0RnJvbUluc3RhbmNlKGRhdGE6IGFueSwgdG9GaXJlSnNvbjogYm9vbGVhbik6IGFueSB7XHJcbiAgICAgIGlmKGRhdGEgaW5zdGFuY2VvZiBNb2RlbCl7XHJcbiAgICAgICAgcmV0dXJuIGRhdGEuaW5uZXJGcm9tSnNvbihkYXRhLCB0b0ZpcmVKc29uKVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBpbnN0YW5jZVRvUGxhaW4oZGF0YSwge2VuYWJsZUNpcmN1bGFyQ2hlY2s6IHRydWV9KVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnJvbUpzb24oZGF0YTogYW55LCBmcm9tRmlyZUpzb246IGJvb2xlYW4gPSBmYWxzZSk6IHRoaXMge1xyXG4gICAgICB0aGlzLmlubmVyRnJvbUpzb24oZGF0YSwgZnJvbUZpcmVKc29uKVxyXG5cclxuICAgICAgdGhpcy5pbml0KClcclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGlubmVyRnJvbUpzb24oZGF0YTogYW55LCBmcm9tRmlyZUpzb246IGJvb2xlYW4pOiB0aGlzIHtcclxuICAgICAgbGV0IGFueVRoaXMgPSB0aGlzIGFzIGFueVxyXG5cclxuICAgICAgY29uc3QgZmllbGREYXRhID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhGaWVsZHMpLmZpZWxkcyA/PyB7fVxyXG4gICAgICBjb25zdCByZWxhdGlvbkRhdGEgPSAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpIGFzIENsYXNzV2l0aFJlbGF0aW9ucykucmVsYXRpb25zID8/IHt9XHJcblxyXG4gICAgICBmb3IoY29uc3QgcHJvcGVydHlLZXkgaW4gZGF0YSkge1xyXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBmaWVsZERhdGFbcHJvcGVydHlLZXldIGFzIEZpZWxkQ29uZmlnID8/IG51bGxcclxuICAgICAgICBjb25zdCByZWxhdGlvbk9wdGlvbiA9IHJlbGF0aW9uRGF0YVtwcm9wZXJ0eUtleV0gYXMgUmVsYXRpb25Db25maWcgPz8gbnVsbFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnN0IGpzb25Qcm9wZXJ0eUtleSA9IG9wdGlvbnM/Lm5hbWUgPz8gcHJvcGVydHlLZXlcclxuICAgICAgICBpZihkYXRhW2pzb25Qcm9wZXJ0eUtleV0pe1xyXG4gICAgICAgICAgaWYob3B0aW9ucz8ubW9kZWxDbGFzcyB8fCAocmVsYXRpb25PcHRpb24/Lm1vZGVsQ2xhc3MgJiYgIWZyb21GaXJlSnNvbikpIHtcclxuICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheShkYXRhW2pzb25Qcm9wZXJ0eUtleV0pKXtcclxuICAgICAgICAgICAgICBhbnlUaGlzW2pzb25Qcm9wZXJ0eUtleV0gPSBuZXcgQXJyYXkoKVxyXG4gICAgICAgICAgICAgIGRhdGFbanNvblByb3BlcnR5S2V5XS5mb3JFYWNoKCh2YWx1ZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBhbnlUaGlzW2pzb25Qcm9wZXJ0eUtleV0ucHVzaCh0aGlzLmNvbnZlcnRUb0luc3RhbmNlKHJlbGF0aW9uT3B0aW9uPy5tb2RlbENsYXNzID8/IG9wdGlvbnMubW9kZWxDbGFzcywgdmFsdWUsIGZyb21GaXJlSnNvbikpXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBhbnlUaGlzW2pzb25Qcm9wZXJ0eUtleV0gPSB0aGlzLmNvbnZlcnRUb0luc3RhbmNlKHJlbGF0aW9uT3B0aW9uPy5tb2RlbENsYXNzID8/IG9wdGlvbnMubW9kZWxDbGFzcywgZGF0YVtqc29uUHJvcGVydHlLZXldLCBmcm9tRmlyZUpzb24pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmKG9wdGlvbnM/LnRpbWVzdGFtcCkge1xyXG4gICAgICAgICAgICAgIGlmKGZyb21GaXJlSnNvbil7XHJcbiAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IHVzZUVuZ2luZSgpLmNvbnZlcnRGcm9tVGltZXN0YW1wKGRhdGFbanNvblByb3BlcnR5S2V5XSlcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSBkYXRhW2pzb25Qcm9wZXJ0eUtleV1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSBkYXRhW2pzb25Qcm9wZXJ0eUtleV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB0aGlzLmlkID0gZGF0YS5pZFxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNvbnZlcnRUb0luc3RhbmNlPFQgZXh0ZW5kcyBDb25zdHJ1Y3RvckZ1bmN0aW9uPHVua25vd24+Pihtb2RlbENsYXNzOiBULCBkYXRhOiBhbnksIGZyb21GaXJlSnNvbjogYm9vbGVhbik6IFQge1xyXG4gICAgICBpZihtb2RlbENsYXNzLnByb3RvdHlwZSBpbnN0YW5jZW9mIE1vZGVsKXtcclxuICAgICAgICByZXR1cm4gKChuZXcgbW9kZWxDbGFzcygpKSBhcyBNb2RlbCkuaW5uZXJGcm9tSnNvbihkYXRhLCBmcm9tRmlyZUpzb24pIGFzIHVua25vd24gYXMgVFxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBwbGFpblRvSW5zdGFuY2UobW9kZWxDbGFzcywgZGF0YSwge2VuYWJsZUNpcmN1bGFyQ2hlY2s6IHRydWV9KSBhcyBUXHJcbiAgICAgIH1cclxuICAgIH1cclxufVxyXG4iXX0=