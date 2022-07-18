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
// import EmployeeRepository from "../repositories/EmployeeRepository";
// import { DateTime } from 'luxon';
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const repositories_1 = require("../src/repositories");
// import Restaurant from '../test/models/Restaurant';
const engine_1 = require("../src/engine");
// import EmployeeRepository from '../test/repositories/EmployeeRepository';
const engine_2 = require("../src/engine");
const src_1 = require("../src");
const ServerEngine_1 = __importDefault(require("~/engine/ServerEngine"));
// import Table from '../../src/tests/models/submodels/Table';
// { 
//     serviceAccount: require('../../service-account.json'),
//     appConfig: {}
// }
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(require('../../service-account.json'))
});
(0, engine_1.startOrm)(new ServerEngine_1.default(firebase_admin_1.default.app()));
let Human = class Human extends src_1.Model {
    getModelName() {
        return 'Human';
    }
};
__decorate([
    (0, src_1.Field)(),
    __metadata("design:type", String)
], Human.prototype, "name", void 0);
Human = __decorate([
    (0, src_1.Collection)({ route: 'humans' })
], Human);
class HumanRepository extends src_1.Repository {
    getModel() {
        return new Human();
    }
}
(0, repositories_1.registerRepositories)([HumanRepository]);
const repo = (0, repositories_1.getRepositoryFor)(Human);
console.log(repo);
(0, engine_2.useEngine)().runTransaction(async () => {
    const human = await repo.load("1");
    // .then(async restaurant => {
    //     // await restaurant.load('employees')
    console.log(human);
    //     // console.log(restaurant.employees)
    //     const rest = new Restaurant()
    //     repo.save(rest).then(r => {
    //         console.log(r)
    //     }).catch(e => {
    //         console.log(e)
    //         console.log(rest.getAllErrors())
    //     })
    // })
});
// const employee = new Employee()
// employee.restaurantId = '1'
// console.log(employee)
// console.log(employee.toJson())
// console.log(employee.getCollectionPath())
// const eRepo = new EmployeeRepository()
// const rRepo = new RestaurantRepository()
// rRepo.load('1').then(restaurant => {
//     console.log(restaurant);
// restaurant.tables.push(new Table())
// console.log(restaurant.tables)
// rRepo.save(restaurant);
// })
// eRepo.load('f3QK1Vt4YN7yNbkG5XDe', { restaurantId: 1 }).then(async (response) => {
//     console.log('loaded', response)
//     console.log(DateTime.fromMillis(response.createdAt.seconds * 1000).toISO({ includeOffset: false }))
//     await response.restaurant
//     console.log(response)
// })
// repo.save(employee).then(() => {
//     console.log('saved')
//     console.log(employee)
// }).catch((e) => {
//     console.log('error')
//     console.log(e)
// })
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NjcmlwdHMvdGVzdGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLHVFQUF1RTtBQUN2RSxvQ0FBb0M7QUFDcEMsb0VBQWtDO0FBQ2xDLHNEQUE2RTtBQUM3RSxzREFBc0Q7QUFDdEQsMENBQXlDO0FBQ3pDLDRFQUE0RTtBQUM1RSwwQ0FBMEM7QUFDMUMsZ0NBQThEO0FBQzlELHlFQUFpRDtBQUNqRCw4REFBOEQ7QUFFOUQsS0FBSztBQUNMLDZEQUE2RDtBQUM3RCxvQkFBb0I7QUFDcEIsSUFBSTtBQUNKLHdCQUFLLENBQUMsYUFBYSxDQUFDO0lBQ2hCLFVBQVUsRUFBRSx3QkFBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDRCQUE0QixDQUFDLENBQUM7Q0FDM0UsQ0FBQyxDQUFBO0FBQ0YsSUFBQSxpQkFBUSxFQUFDLElBQUksc0JBQVksQ0FBQyx3QkFBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUd2QyxJQUFNLEtBQUssR0FBWCxNQUFNLEtBQU0sU0FBUSxXQUFLO0lBQ3JCLFlBQVk7UUFDUixPQUFPLE9BQU8sQ0FBQTtJQUNsQixDQUFDO0NBR0osQ0FBQTtBQURHO0lBREMsSUFBQSxXQUFLLEdBQUU7O21DQUNJO0FBTFYsS0FBSztJQURWLElBQUEsZ0JBQVUsRUFBQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUMsQ0FBQztHQUN6QixLQUFLLENBTVY7QUFFRCxNQUFNLGVBQWdCLFNBQVEsZ0JBQWlCO0lBQzNDLFFBQVE7UUFDSixPQUFPLElBQUksS0FBSyxFQUFFLENBQUE7SUFDdEIsQ0FBQztDQUNKO0FBRUQsSUFBQSxtQ0FBb0IsRUFBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUE7QUFFdkMsTUFBTSxJQUFJLEdBQUcsSUFBQSwrQkFBZ0IsRUFBa0IsS0FBSyxDQUFDLENBQUE7QUFDckQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUVqQixJQUFBLGtCQUFTLEdBQUUsQ0FBQyxjQUFjLENBQUMsS0FBSyxJQUFJLEVBQUU7SUFDbEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ2xDLDhCQUE4QjtJQUM5Qiw0Q0FBNEM7SUFDNUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUNsQiwyQ0FBMkM7SUFFM0Msb0NBQW9DO0lBQ3BDLGtDQUFrQztJQUNsQyx5QkFBeUI7SUFDekIsc0JBQXNCO0lBQ3RCLHlCQUF5QjtJQUN6QiwyQ0FBMkM7SUFDM0MsU0FBUztJQUNULEtBQUs7QUFDVCxDQUFDLENBQUMsQ0FBQTtBQUNGLGtDQUFrQztBQUNsQyw4QkFBOEI7QUFDOUIsd0JBQXdCO0FBRXhCLGlDQUFpQztBQUVqQyw0Q0FBNEM7QUFFNUMseUNBQXlDO0FBQ3pDLDJDQUEyQztBQUUzQyx1Q0FBdUM7QUFDdkMsK0JBQStCO0FBRTNCLHNDQUFzQztBQUN0QyxpQ0FBaUM7QUFDakMsMEJBQTBCO0FBQzlCLEtBQUs7QUFFTCxxRkFBcUY7QUFDckYsc0NBQXNDO0FBQ3RDLDBHQUEwRztBQUUxRyxnQ0FBZ0M7QUFDaEMsNEJBQTRCO0FBQzVCLEtBQUs7QUFFTCxtQ0FBbUM7QUFDbkMsMkJBQTJCO0FBQzNCLDRCQUE0QjtBQUM1QixvQkFBb0I7QUFDcEIsMkJBQTJCO0FBQzNCLHFCQUFxQjtBQUNyQixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiLy8gaW1wb3J0IEVtcGxveWVlUmVwb3NpdG9yeSBmcm9tIFwiLi4vcmVwb3NpdG9yaWVzL0VtcGxveWVlUmVwb3NpdG9yeVwiO1xyXG4vLyBpbXBvcnQgeyBEYXRlVGltZSB9IGZyb20gJ2x1eG9uJztcclxuaW1wb3J0IGFkbWluIGZyb20gJ2ZpcmViYXNlLWFkbWluJ1xyXG5pbXBvcnQgeyBnZXRSZXBvc2l0b3J5Rm9yLCByZWdpc3RlclJlcG9zaXRvcmllcyB9IGZyb20gJy4uL3NyYy9yZXBvc2l0b3JpZXMnO1xyXG4vLyBpbXBvcnQgUmVzdGF1cmFudCBmcm9tICcuLi90ZXN0L21vZGVscy9SZXN0YXVyYW50JztcclxuaW1wb3J0IHsgc3RhcnRPcm0gfSBmcm9tICcuLi9zcmMvZW5naW5lJztcclxuLy8gaW1wb3J0IEVtcGxveWVlUmVwb3NpdG9yeSBmcm9tICcuLi90ZXN0L3JlcG9zaXRvcmllcy9FbXBsb3llZVJlcG9zaXRvcnknO1xyXG5pbXBvcnQgeyB1c2VFbmdpbmUgfSBmcm9tICcuLi9zcmMvZW5naW5lJztcclxuaW1wb3J0IHsgQ29sbGVjdGlvbiwgRmllbGQsIE1vZGVsLCBSZXBvc2l0b3J5IH0gZnJvbSAnLi4vc3JjJztcclxuaW1wb3J0IFNlcnZlckVuZ2luZSBmcm9tICd+L2VuZ2luZS9TZXJ2ZXJFbmdpbmUnO1xyXG4vLyBpbXBvcnQgVGFibGUgZnJvbSAnLi4vLi4vc3JjL3Rlc3RzL21vZGVscy9zdWJtb2RlbHMvVGFibGUnO1xyXG5cclxuLy8geyBcclxuLy8gICAgIHNlcnZpY2VBY2NvdW50OiByZXF1aXJlKCcuLi8uLi9zZXJ2aWNlLWFjY291bnQuanNvbicpLFxyXG4vLyAgICAgYXBwQ29uZmlnOiB7fVxyXG4vLyB9XHJcbmFkbWluLmluaXRpYWxpemVBcHAoe1xyXG4gICAgY3JlZGVudGlhbDogYWRtaW4uY3JlZGVudGlhbC5jZXJ0KHJlcXVpcmUoJy4uLy4uL3NlcnZpY2UtYWNjb3VudC5qc29uJykpXHJcbn0pXHJcbnN0YXJ0T3JtKG5ldyBTZXJ2ZXJFbmdpbmUoYWRtaW4uYXBwKCkpKVxyXG5cclxuQENvbGxlY3Rpb24oeyByb3V0ZTogJ2h1bWFucyd9KVx0XHJcbmNsYXNzIEh1bWFuIGV4dGVuZHMgTW9kZWwge1xyXG4gICAgZ2V0TW9kZWxOYW1lKCk6IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuICdIdW1hbidcclxuICAgIH1cclxuICAgIEBGaWVsZCgpXHJcbiAgICBuYW1lOiBzdHJpbmcgICAgXHJcbn1cclxuXHJcbmNsYXNzIEh1bWFuUmVwb3NpdG9yeSBleHRlbmRzIFJlcG9zaXRvcnk8SHVtYW4+e1xyXG4gICAgZ2V0TW9kZWwoKTogSHVtYW4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgSHVtYW4oKVxyXG4gICAgfVxyXG59XHJcblxyXG5yZWdpc3RlclJlcG9zaXRvcmllcyhbSHVtYW5SZXBvc2l0b3J5XSlcclxuXHJcbmNvbnN0IHJlcG8gPSBnZXRSZXBvc2l0b3J5Rm9yPEh1bWFuUmVwb3NpdG9yeT4oSHVtYW4pIFxyXG5jb25zb2xlLmxvZyhyZXBvKVxyXG5cclxudXNlRW5naW5lKCkucnVuVHJhbnNhY3Rpb24oYXN5bmMgKCkgPT4ge1xyXG4gICAgY29uc3QgaHVtYW4gPSBhd2FpdCByZXBvLmxvYWQoXCIxXCIpXHJcbiAgICAvLyAudGhlbihhc3luYyByZXN0YXVyYW50ID0+IHtcclxuICAgIC8vICAgICAvLyBhd2FpdCByZXN0YXVyYW50LmxvYWQoJ2VtcGxveWVlcycpXHJcbiAgICBjb25zb2xlLmxvZyhodW1hbilcclxuICAgIC8vICAgICAvLyBjb25zb2xlLmxvZyhyZXN0YXVyYW50LmVtcGxveWVlcylcclxuXHJcbiAgICAvLyAgICAgY29uc3QgcmVzdCA9IG5ldyBSZXN0YXVyYW50KClcclxuICAgIC8vICAgICByZXBvLnNhdmUocmVzdCkudGhlbihyID0+IHtcclxuICAgIC8vICAgICAgICAgY29uc29sZS5sb2cocilcclxuICAgIC8vICAgICB9KS5jYXRjaChlID0+IHtcclxuICAgIC8vICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgIC8vICAgICAgICAgY29uc29sZS5sb2cocmVzdC5nZXRBbGxFcnJvcnMoKSlcclxuICAgIC8vICAgICB9KVxyXG4gICAgLy8gfSlcclxufSlcclxuLy8gY29uc3QgZW1wbG95ZWUgPSBuZXcgRW1wbG95ZWUoKVxyXG4vLyBlbXBsb3llZS5yZXN0YXVyYW50SWQgPSAnMSdcclxuLy8gY29uc29sZS5sb2coZW1wbG95ZWUpXHJcblxyXG4vLyBjb25zb2xlLmxvZyhlbXBsb3llZS50b0pzb24oKSlcclxuXHJcbi8vIGNvbnNvbGUubG9nKGVtcGxveWVlLmdldENvbGxlY3Rpb25QYXRoKCkpXHJcblxyXG4vLyBjb25zdCBlUmVwbyA9IG5ldyBFbXBsb3llZVJlcG9zaXRvcnkoKVxyXG4vLyBjb25zdCByUmVwbyA9IG5ldyBSZXN0YXVyYW50UmVwb3NpdG9yeSgpXHJcblxyXG4vLyByUmVwby5sb2FkKCcxJykudGhlbihyZXN0YXVyYW50ID0+IHtcclxuLy8gICAgIGNvbnNvbGUubG9nKHJlc3RhdXJhbnQpO1xyXG5cclxuICAgIC8vIHJlc3RhdXJhbnQudGFibGVzLnB1c2gobmV3IFRhYmxlKCkpXHJcbiAgICAvLyBjb25zb2xlLmxvZyhyZXN0YXVyYW50LnRhYmxlcylcclxuICAgIC8vIHJSZXBvLnNhdmUocmVzdGF1cmFudCk7XHJcbi8vIH0pXHJcblxyXG4vLyBlUmVwby5sb2FkKCdmM1FLMVZ0NFlON3lOYmtHNVhEZScsIHsgcmVzdGF1cmFudElkOiAxIH0pLnRoZW4oYXN5bmMgKHJlc3BvbnNlKSA9PiB7XHJcbi8vICAgICBjb25zb2xlLmxvZygnbG9hZGVkJywgcmVzcG9uc2UpXHJcbi8vICAgICBjb25zb2xlLmxvZyhEYXRlVGltZS5mcm9tTWlsbGlzKHJlc3BvbnNlLmNyZWF0ZWRBdC5zZWNvbmRzICogMTAwMCkudG9JU08oeyBpbmNsdWRlT2Zmc2V0OiBmYWxzZSB9KSlcclxuXHJcbi8vICAgICBhd2FpdCByZXNwb25zZS5yZXN0YXVyYW50XHJcbi8vICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcclxuLy8gfSlcclxuXHJcbi8vIHJlcG8uc2F2ZShlbXBsb3llZSkudGhlbigoKSA9PiB7XHJcbi8vICAgICBjb25zb2xlLmxvZygnc2F2ZWQnKVxyXG4vLyAgICAgY29uc29sZS5sb2coZW1wbG95ZWUpXHJcbi8vIH0pLmNhdGNoKChlKSA9PiB7XHJcbi8vICAgICBjb25zb2xlLmxvZygnZXJyb3InKVxyXG4vLyAgICAgY29uc29sZS5sb2coZSlcclxuLy8gfSlcclxuIl19