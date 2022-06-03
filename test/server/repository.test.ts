import 'reflect-metadata'
import admin from 'firebase-admin'
import {  startOrm,  getRepositoryFor, registerRepositories } from "../../src"
import { Human, Dog, Cat } from "../data/models"
import ServerEngine from '../../src/engine/ServerEngine'
import { DogRepository, HumanRepository, CatRepository } from '../data/repositories'


let dogRepository: DogRepository = null
let catRepository: CatRepository = null
let humanRepository: HumanRepository = null

admin.initializeApp({
    credential: admin.credential.cert(require('../../service-account.json'))
})
startOrm(new ServerEngine(admin.app()))

registerRepositories([DogRepository, HumanRepository, CatRepository])

beforeAll(async () => {
    dogRepository = getRepositoryFor(Dog) as DogRepository
    humanRepository = getRepositoryFor(Human) as HumanRepository
    catRepository = getRepositoryFor(Cat) as CatRepository

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
    await admin.firestore().collection('humans/1/cats').doc('1').set({
        name: 'Leprechaun'
    })
});

afterAll(async () => {
    await admin.firestore().collection('humans/1/cats').doc('1').delete()
    await admin.firestore().collection('humans/1/dogs').doc('1').delete()
    await admin.firestore().collection('humans').doc('1').delete()
    await admin.firestore().collection('humans').doc('2').delete()
});

test('loadMany on model by repository', async () => {
    const cat = await catRepository.load("1", { humanId: "1"})
    console.log(cat)
    await cat.loadMany(['human', 'human.dogs'])

    expect(cat.name).toBe("Leprechaun")
    expect(cat.human.name).toBe("John")
    expect(cat.human.dogs[0].id).toBe("1")
    expect(cat.human.dogs[0].name).toBe("Fido")
})

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