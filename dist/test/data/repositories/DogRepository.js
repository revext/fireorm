"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DogRepository = void 0;
const index_1 = require("../../../src/index");
const models_1 = require("../models");
class DogRepository extends index_1.Repository {
    getModel() {
        return new models_1.Dog();
    }
}
exports.DogRepository = DogRepository;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRG9nUmVwb3NpdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Rlc3QvZGF0YS9yZXBvc2l0b3JpZXMvRG9nUmVwb3NpdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw4Q0FBZ0Q7QUFDaEQsc0NBQWdDO0FBRWhDLE1BQWEsYUFBYyxTQUFRLGtCQUFlO0lBQzlDLFFBQVE7UUFDSixPQUFPLElBQUksWUFBRyxFQUFFLENBQUE7SUFDcEIsQ0FBQztDQUNKO0FBSkQsc0NBSUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSZXBvc2l0b3J5IH0gZnJvbSBcIi4uLy4uLy4uL3NyYy9pbmRleFwiO1xyXG5pbXBvcnQgeyBEb2cgfSBmcm9tIFwiLi4vbW9kZWxzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRG9nUmVwb3NpdG9yeSBleHRlbmRzIFJlcG9zaXRvcnk8RG9nPntcclxuICAgIGdldE1vZGVsKCk6IERvZyB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBEb2coKVxyXG4gICAgfVxyXG59XHJcbiJdfQ==