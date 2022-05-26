import 'reflect-metadata'
import admin from 'firebase-admin'
import { Collection, startOrm, Field, getRepositoryFor, HasMany, HasCollection, Model, registerRepositories, Repository } from "../../src"
import serviceAccount from '../../service-account.json'
import ServerEngine from '../../src/engine/ServerEngine'

class Bone extends Model {
    @Field()
    length: number = 0
}

@Collection({ route: 'humans/{humanId}/dogs'})	
class Dog extends Model {
    @Field()
    name: string    

    @Field({ routeParam: true })
    humanId: string = "1"

    @Field({ modelClass: Bone })
    bones: Bone[]
}

@Collection({ route: 'humans'})	
class Human extends Model {
    @Field()
    name: string    

    @HasMany({ modelClass: Human, mapIds: (_: Human) => { return ['2'] } })
    relatives: Human[]

    @HasCollection({ modelClass: Dog })
    dogs: Dog[]
}

class DogRepository extends Repository<Dog>{
    getModel(): Dog {
        return new Dog()
    }
}

class HumanRepository extends Repository<Human>{
    getModel(): Human {
        return new Human()
    }
}

let dogRepository: DogRepository = null
let humanRepository: HumanRepository = null

beforeAll(async () => {
    admin.initializeApp({
        credential: admin.credential.cert(require('../../service-account.json'))
    })
    startOrm(new ServerEngine(admin.app()))
    
    registerRepositories([DogRepository, HumanRepository])

    dogRepository = getRepositoryFor(Dog) as DogRepository
    humanRepository = getRepositoryFor(Human) as HumanRepository

    await admin.firestore().collection('humans').doc('1').set({
        name: 'John'
    })
    await admin.firestore().collection('humans').doc('2').set({
        name: 'Jim'
    })
    await admin.firestore().collection('humans/1/dogs').doc('1').set({
        name: 'Fido',	
        bones: [
            { length: 10 },
            { length: 20 },
        ]
    })
});

afterAll(async () => {
    await admin.firestore().collection('humans/1/dogs').doc('1').delete()
    await admin.firestore().collection('humans').doc('1').delete()
    await admin.firestore().collection('humans').doc('2').delete()
});

test('load by id on repository', async () => {
    const human = await humanRepository.load("1")

    expect(human.name).toBe('John')
})

test('loadMany by ids on repository', async () => {
    const humans = await humanRepository.loadMany(["1", "2"])

    expect(humans.length).toBe(2)
    expect(humans[0].name).toBe('John')
    expect(humans[1].name).toBe('Jim')
})

test('loadMany on model by repository', async () => {
    const human = await humanRepository.load("1")
    await human.load('relatives')
    human.relatives

    expect(human.relatives.length).toBe(1)
    expect(human.relatives[0].name).toBe('Jim')
})

test('load by id with additional route params on repository', async () => {
    const dog = await dogRepository.load("1", { humanId: "1" })

    expect(dog.name).toBe('Fido')
    expect(dog.bones[0].length).toBe(10)
    expect(dog.bones[1].length).toBe(20)
})

test('load subcollection on model with repository', async () => {
    const human = await humanRepository.load("1")

    await human.load("dogs")
    expect(human.dogs.length).toBe(1)
    expect(human.dogs[0].name).toBe("Fido")
})