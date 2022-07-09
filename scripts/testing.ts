import 'reflect-metadata'
// import EmployeeRepository from "../repositories/EmployeeRepository";
// import { DateTime } from 'luxon';
import admin from 'firebase-admin'
import { getRepositoryFor, registerRepositories } from '../src/repositories';
// import Restaurant from '../test/models/Restaurant';
import { startOrm } from '../src/engine';
// import EmployeeRepository from '../test/repositories/EmployeeRepository';
import { useEngine } from '../src/engine';
import { Collection, Field, Model, Repository } from '../src';
import ServerEngine from '~/engine/ServerEngine';
// import Table from '../../src/tests/models/submodels/Table';

// { 
//     serviceAccount: require('../../service-account.json'),
//     appConfig: {}
// }
admin.initializeApp({
    credential: admin.credential.cert(require('../../service-account.json'))
})
startOrm(new ServerEngine(admin.app()))

@Collection({ route: 'humans'})	
class Human extends Model {
    @Field()
    name: string    
}

class HumanRepository extends Repository<Human>{
    getModel(): Human {
        return new Human()
    }
}

registerRepositories([HumanRepository])

const repo = getRepositoryFor<HumanRepository>(Human) 
console.log(repo)

useEngine().runTransaction(async () => {
    const human = await repo.load("1")
    // .then(async restaurant => {
    //     // await restaurant.load('employees')
    console.log(human)
    //     // console.log(restaurant.employees)

    //     const rest = new Restaurant()
    //     repo.save(rest).then(r => {
    //         console.log(r)
    //     }).catch(e => {
    //         console.log(e)
    //         console.log(rest.getAllErrors())
    //     })
    // })
})
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
