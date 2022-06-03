# Revext FireORM

This project aim to unite the Firebase Firestore Admin and Client libraries. The purpose of the unification is to be able to use the same TS codebase for client and server side projects. Using this you won't need to define different models and repositories for the two sides, instead it handles them in the same manner mapping the calls to their respective implementations.

# Installing the project
First run the install command:

```
npm install -S revext-fireorm
```

After installation you have to initialize the ORM:

On server side like this:
``` Javascript
// This is the part where you initialize your project, eg.: index.js

//import the firebase admin and the service account json
import admin from 'firebase-admin'
const serviceAccount = require('/your/path/to/the/service-account.json')

//TODO
import { startOrm } from 'revext-fireorm'
import { ServerEngine } from 'revext-fireorm/dist/'

//initialize firebase the usual way
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

startOrm(new ServerEngine(admin.app()))
```


properties have to be initialized


