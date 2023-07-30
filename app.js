require('dotenv').config()
const express = require('express')
const cors = require('cors')
const session = require('express-session')
const UsersRoute = require('./routes/UserRoute')
const sequelizeStore = require('connect-session-sequelize')
const db = require('./config/database')


const env = process.env

const PORT = env.APP_PORT1 || env.APP_PORT2 || env.APP_PORT3 || 8000

const app = express();

// (async()=>{
//     await db.sync();
// })();

const sessionStore = sequelizeStore(session.Store)

const store = new sessionStore({
    db,
})

// store.sync();

app.use(session({
    secret: env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    store: store,
    cookie:{
        secure: "auto"
    }
}))
app.use(cors())
app.use(express.json())
app.use(UsersRoute)

app.listen(PORT, ()=>{
    console.log(`SERVER TELAH BERJALAN DI http://localhost:${PORT}`);
})