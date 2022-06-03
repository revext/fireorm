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
require("reflect-metadata");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NjcmlwdHMvdGVzdGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLDRCQUF5QjtBQUN6Qix1RUFBdUU7QUFDdkUsb0NBQW9DO0FBQ3BDLG9FQUFrQztBQUNsQyxzREFBNkU7QUFDN0Usc0RBQXNEO0FBQ3RELDBDQUF5QztBQUN6Qyw0RUFBNEU7QUFDNUUsMENBQTBDO0FBQzFDLGdDQUE4RDtBQUM5RCx5RUFBaUQ7QUFDakQsOERBQThEO0FBRTlELEtBQUs7QUFDTCw2REFBNkQ7QUFDN0Qsb0JBQW9CO0FBQ3BCLElBQUk7QUFDSix3QkFBSyxDQUFDLGFBQWEsQ0FBQztJQUNoQixVQUFVLEVBQUUsd0JBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0NBQzNFLENBQUMsQ0FBQTtBQUNGLElBQUEsaUJBQVEsRUFBQyxJQUFJLHNCQUFZLENBQUMsd0JBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFHdkMsSUFBTSxLQUFLLEdBQVgsTUFBTSxLQUFNLFNBQVEsV0FBSztDQUd4QixDQUFBO0FBREc7SUFEQyxJQUFBLFdBQUssR0FBRTs7bUNBQ0k7QUFGVixLQUFLO0lBRFYsSUFBQSxnQkFBVSxFQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBQyxDQUFDO0dBQ3pCLEtBQUssQ0FHVjtBQUVELE1BQU0sZUFBZ0IsU0FBUSxnQkFBaUI7SUFDM0MsUUFBUTtRQUNKLE9BQU8sSUFBSSxLQUFLLEVBQUUsQ0FBQTtJQUN0QixDQUFDO0NBQ0o7QUFFRCxJQUFBLG1DQUFvQixFQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQTtBQUV2QyxNQUFNLElBQUksR0FBRyxJQUFBLCtCQUFnQixFQUFDLEtBQUssQ0FBb0IsQ0FBQTtBQUN2RCxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFBO0FBRWpCLElBQUEsa0JBQVMsR0FBRSxDQUFDLGNBQWMsQ0FBQyxLQUFLLElBQUksRUFBRTtJQUNsQyxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7SUFDbEMsOEJBQThCO0lBQzlCLDRDQUE0QztJQUM1QyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQ2xCLDJDQUEyQztJQUUzQyxvQ0FBb0M7SUFDcEMsa0NBQWtDO0lBQ2xDLHlCQUF5QjtJQUN6QixzQkFBc0I7SUFDdEIseUJBQXlCO0lBQ3pCLDJDQUEyQztJQUMzQyxTQUFTO0lBQ1QsS0FBSztBQUNULENBQUMsQ0FBQyxDQUFBO0FBQ0Ysa0NBQWtDO0FBQ2xDLDhCQUE4QjtBQUM5Qix3QkFBd0I7QUFFeEIsaUNBQWlDO0FBRWpDLDRDQUE0QztBQUU1Qyx5Q0FBeUM7QUFDekMsMkNBQTJDO0FBRTNDLHVDQUF1QztBQUN2QywrQkFBK0I7QUFFM0Isc0NBQXNDO0FBQ3RDLGlDQUFpQztBQUNqQywwQkFBMEI7QUFDOUIsS0FBSztBQUVMLHFGQUFxRjtBQUNyRixzQ0FBc0M7QUFDdEMsMEdBQTBHO0FBRTFHLGdDQUFnQztBQUNoQyw0QkFBNEI7QUFDNUIsS0FBSztBQUVMLG1DQUFtQztBQUNuQywyQkFBMkI7QUFDM0IsNEJBQTRCO0FBQzVCLG9CQUFvQjtBQUNwQiwyQkFBMkI7QUFDM0IscUJBQXFCO0FBQ3JCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJ3JlZmxlY3QtbWV0YWRhdGEnXHJcbi8vIGltcG9ydCBFbXBsb3llZVJlcG9zaXRvcnkgZnJvbSBcIi4uL3JlcG9zaXRvcmllcy9FbXBsb3llZVJlcG9zaXRvcnlcIjtcclxuLy8gaW1wb3J0IHsgRGF0ZVRpbWUgfSBmcm9tICdsdXhvbic7XHJcbmltcG9ydCBhZG1pbiBmcm9tICdmaXJlYmFzZS1hZG1pbidcclxuaW1wb3J0IHsgZ2V0UmVwb3NpdG9yeUZvciwgcmVnaXN0ZXJSZXBvc2l0b3JpZXMgfSBmcm9tICcuLi9zcmMvcmVwb3NpdG9yaWVzJztcclxuLy8gaW1wb3J0IFJlc3RhdXJhbnQgZnJvbSAnLi4vdGVzdC9tb2RlbHMvUmVzdGF1cmFudCc7XHJcbmltcG9ydCB7IHN0YXJ0T3JtIH0gZnJvbSAnLi4vc3JjL2VuZ2luZSc7XHJcbi8vIGltcG9ydCBFbXBsb3llZVJlcG9zaXRvcnkgZnJvbSAnLi4vdGVzdC9yZXBvc2l0b3JpZXMvRW1wbG95ZWVSZXBvc2l0b3J5JztcclxuaW1wb3J0IHsgdXNlRW5naW5lIH0gZnJvbSAnLi4vc3JjL2VuZ2luZSc7XHJcbmltcG9ydCB7IENvbGxlY3Rpb24sIEZpZWxkLCBNb2RlbCwgUmVwb3NpdG9yeSB9IGZyb20gJy4uL3NyYyc7XHJcbmltcG9ydCBTZXJ2ZXJFbmdpbmUgZnJvbSAnfi9lbmdpbmUvU2VydmVyRW5naW5lJztcclxuLy8gaW1wb3J0IFRhYmxlIGZyb20gJy4uLy4uL3NyYy90ZXN0cy9tb2RlbHMvc3VibW9kZWxzL1RhYmxlJztcclxuXHJcbi8vIHsgXHJcbi8vICAgICBzZXJ2aWNlQWNjb3VudDogcmVxdWlyZSgnLi4vLi4vc2VydmljZS1hY2NvdW50Lmpzb24nKSxcclxuLy8gICAgIGFwcENvbmZpZzoge31cclxuLy8gfVxyXG5hZG1pbi5pbml0aWFsaXplQXBwKHtcclxuICAgIGNyZWRlbnRpYWw6IGFkbWluLmNyZWRlbnRpYWwuY2VydChyZXF1aXJlKCcuLi8uLi9zZXJ2aWNlLWFjY291bnQuanNvbicpKVxyXG59KVxyXG5zdGFydE9ybShuZXcgU2VydmVyRW5naW5lKGFkbWluLmFwcCgpKSlcclxuXHJcbkBDb2xsZWN0aW9uKHsgcm91dGU6ICdodW1hbnMnfSlcdFxyXG5jbGFzcyBIdW1hbiBleHRlbmRzIE1vZGVsIHtcclxuICAgIEBGaWVsZCgpXHJcbiAgICBuYW1lOiBzdHJpbmcgICAgXHJcbn1cclxuXHJcbmNsYXNzIEh1bWFuUmVwb3NpdG9yeSBleHRlbmRzIFJlcG9zaXRvcnk8SHVtYW4+e1xyXG4gICAgZ2V0TW9kZWwoKTogSHVtYW4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgSHVtYW4oKVxyXG4gICAgfVxyXG59XHJcblxyXG5yZWdpc3RlclJlcG9zaXRvcmllcyhbSHVtYW5SZXBvc2l0b3J5XSlcclxuXHJcbmNvbnN0IHJlcG8gPSBnZXRSZXBvc2l0b3J5Rm9yKEh1bWFuKSBhcyBIdW1hblJlcG9zaXRvcnlcclxuY29uc29sZS5sb2cocmVwbylcclxuXHJcbnVzZUVuZ2luZSgpLnJ1blRyYW5zYWN0aW9uKGFzeW5jICgpID0+IHtcclxuICAgIGNvbnN0IGh1bWFuID0gYXdhaXQgcmVwby5sb2FkKFwiMVwiKVxyXG4gICAgLy8gLnRoZW4oYXN5bmMgcmVzdGF1cmFudCA9PiB7XHJcbiAgICAvLyAgICAgLy8gYXdhaXQgcmVzdGF1cmFudC5sb2FkKCdlbXBsb3llZXMnKVxyXG4gICAgY29uc29sZS5sb2coaHVtYW4pXHJcbiAgICAvLyAgICAgLy8gY29uc29sZS5sb2cocmVzdGF1cmFudC5lbXBsb3llZXMpXHJcblxyXG4gICAgLy8gICAgIGNvbnN0IHJlc3QgPSBuZXcgUmVzdGF1cmFudCgpXHJcbiAgICAvLyAgICAgcmVwby5zYXZlKHJlc3QpLnRoZW4ociA9PiB7XHJcbiAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKHIpXHJcbiAgICAvLyAgICAgfSkuY2F0Y2goZSA9PiB7XHJcbiAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKHJlc3QuZ2V0QWxsRXJyb3JzKCkpXHJcbiAgICAvLyAgICAgfSlcclxuICAgIC8vIH0pXHJcbn0pXHJcbi8vIGNvbnN0IGVtcGxveWVlID0gbmV3IEVtcGxveWVlKClcclxuLy8gZW1wbG95ZWUucmVzdGF1cmFudElkID0gJzEnXHJcbi8vIGNvbnNvbGUubG9nKGVtcGxveWVlKVxyXG5cclxuLy8gY29uc29sZS5sb2coZW1wbG95ZWUudG9Kc29uKCkpXHJcblxyXG4vLyBjb25zb2xlLmxvZyhlbXBsb3llZS5nZXRDb2xsZWN0aW9uUGF0aCgpKVxyXG5cclxuLy8gY29uc3QgZVJlcG8gPSBuZXcgRW1wbG95ZWVSZXBvc2l0b3J5KClcclxuLy8gY29uc3QgclJlcG8gPSBuZXcgUmVzdGF1cmFudFJlcG9zaXRvcnkoKVxyXG5cclxuLy8gclJlcG8ubG9hZCgnMScpLnRoZW4ocmVzdGF1cmFudCA9PiB7XHJcbi8vICAgICBjb25zb2xlLmxvZyhyZXN0YXVyYW50KTtcclxuXHJcbiAgICAvLyByZXN0YXVyYW50LnRhYmxlcy5wdXNoKG5ldyBUYWJsZSgpKVxyXG4gICAgLy8gY29uc29sZS5sb2cocmVzdGF1cmFudC50YWJsZXMpXHJcbiAgICAvLyByUmVwby5zYXZlKHJlc3RhdXJhbnQpO1xyXG4vLyB9KVxyXG5cclxuLy8gZVJlcG8ubG9hZCgnZjNRSzFWdDRZTjd5TmJrRzVYRGUnLCB7IHJlc3RhdXJhbnRJZDogMSB9KS50aGVuKGFzeW5jIChyZXNwb25zZSkgPT4ge1xyXG4vLyAgICAgY29uc29sZS5sb2coJ2xvYWRlZCcsIHJlc3BvbnNlKVxyXG4vLyAgICAgY29uc29sZS5sb2coRGF0ZVRpbWUuZnJvbU1pbGxpcyhyZXNwb25zZS5jcmVhdGVkQXQuc2Vjb25kcyAqIDEwMDApLnRvSVNPKHsgaW5jbHVkZU9mZnNldDogZmFsc2UgfSkpXHJcblxyXG4vLyAgICAgYXdhaXQgcmVzcG9uc2UucmVzdGF1cmFudFxyXG4vLyAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXHJcbi8vIH0pXHJcblxyXG4vLyByZXBvLnNhdmUoZW1wbG95ZWUpLnRoZW4oKCkgPT4ge1xyXG4vLyAgICAgY29uc29sZS5sb2coJ3NhdmVkJylcclxuLy8gICAgIGNvbnNvbGUubG9nKGVtcGxveWVlKVxyXG4vLyB9KS5jYXRjaCgoZSkgPT4ge1xyXG4vLyAgICAgY29uc29sZS5sb2coJ2Vycm9yJylcclxuLy8gICAgIGNvbnNvbGUubG9nKGUpXHJcbi8vIH0pXHJcbiJdfQ==