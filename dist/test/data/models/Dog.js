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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dog = void 0;
const index_1 = require("../../../src/index");
const _1 = require(".");
let Dog = class Dog extends index_1.Model {
    constructor() {
        super(...arguments);
        this.humanId = "1";
        this.type = 'terrier';
        //TODO be able to convert map values as modelClasses
        this.tagNames = new Map([['test1', 'test2']]);
    }
};
__decorate([
    (0, index_1.Field)(),
    __metadata("design:type", String)
], Dog.prototype, "name", void 0);
__decorate([
    (0, index_1.Field)({ routeParam: true }),
    __metadata("design:type", String)
], Dog.prototype, "humanId", void 0);
__decorate([
    (0, index_1.Field)({ modelClass: _1.Bone }),
    __metadata("design:type", Array)
], Dog.prototype, "bones", void 0);
__decorate([
    (0, index_1.Field)({ modelClass: Map }),
    __metadata("design:type", Map)
], Dog.prototype, "tagNames", void 0);
Dog = __decorate([
    (0, index_1.Collection)({ route: '/humans/{humanId}/dogs' })
], Dog);
exports.Dog = Dog;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vdGVzdC9kYXRhL21vZGVscy9Eb2cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsOENBQTZEO0FBQzdELHdCQUF3QjtBQUd4QixJQUFhLEdBQUcsR0FBaEIsTUFBYSxHQUFJLFNBQVEsYUFBSztJQUE5Qjs7UUFLSSxZQUFPLEdBQVcsR0FBRyxDQUFBO1FBS3JCLFNBQUksR0FBVyxTQUFTLENBQUE7UUFFeEIsb0RBQW9EO1FBRXBELGFBQVEsR0FBd0IsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDaEUsQ0FBQztDQUFBLENBQUE7QUFiRztJQURDLElBQUEsYUFBSyxHQUFFOztpQ0FDSTtBQUdaO0lBREMsSUFBQSxhQUFLLEVBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUM7O29DQUNQO0FBR3JCO0lBREMsSUFBQSxhQUFLLEVBQUMsRUFBRSxVQUFVLEVBQUUsT0FBSSxFQUFFLENBQUM7O2tDQUNmO0FBTWI7SUFEQyxJQUFBLGFBQUssRUFBQyxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQzs4QkFDakIsR0FBRztxQ0FBK0M7QUFkbkQsR0FBRztJQURmLElBQUEsa0JBQVUsRUFBQyxFQUFFLEtBQUssRUFBRSx3QkFBd0IsRUFBQyxDQUFDO0dBQ2xDLEdBQUcsQ0FlZjtBQWZZLGtCQUFHIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29sbGVjdGlvbiwgTW9kZWwsIEZpZWxkIH0gZnJvbSBcIi4uLy4uLy4uL3NyYy9pbmRleFwiXHJcbmltcG9ydCB7IEJvbmUgfSBmcm9tICcuJ1xyXG5cclxuQENvbGxlY3Rpb24oeyByb3V0ZTogJy9odW1hbnMve2h1bWFuSWR9L2RvZ3MnfSlcdFxyXG5leHBvcnQgY2xhc3MgRG9nIGV4dGVuZHMgTW9kZWwge1xyXG4gICAgQEZpZWxkKClcclxuICAgIG5hbWU6IHN0cmluZyAgICBcclxuXHJcbiAgICBARmllbGQoeyByb3V0ZVBhcmFtOiB0cnVlIH0pXHJcbiAgICBodW1hbklkOiBzdHJpbmcgPSBcIjFcIlxyXG5cclxuICAgIEBGaWVsZCh7IG1vZGVsQ2xhc3M6IEJvbmUgfSlcclxuICAgIGJvbmVzOiBCb25lW11cclxuXHJcbiAgICB0eXBlOiBzdHJpbmcgPSAndGVycmllcidcclxuXHJcbiAgICAvL1RPRE8gYmUgYWJsZSB0byBjb252ZXJ0IG1hcCB2YWx1ZXMgYXMgbW9kZWxDbGFzc2VzXHJcbiAgICBARmllbGQoeyBtb2RlbENsYXNzOiBNYXAgfSlcclxuICAgIHRhZ05hbWVzOiBNYXA8c3RyaW5nLCBzdHJpbmc+ID0gbmV3IE1hcChbWyd0ZXN0MScsJ3Rlc3QyJ11dKVxyXG59Il19