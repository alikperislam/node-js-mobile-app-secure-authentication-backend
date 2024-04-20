//! npm start(nodemon)
import express from "express";
import "dotenv/config.js";
//? route
import routeMailValidator from './app/auth/mail_validator.js';
import routeSignIn from './app/auth/register_signin.js';
import routeLogIn from './app/auth/register_login.js';
//? constants
const app = express();
const port = process.env.PORT;

//? route middlewares
app.use(process.env.EMAIL_ROUTE_PATH, routeMailValidator);
app.use(process.env.REGISTER_ROUTE_PATH, routeSignIn);
app.use(process.env.REGISTER_ROUTE_PATH, routeLogIn);

//? utility middlewares
app.use(express.json());
// url uzerinden gelen api isteklerini ayristirip req.body'ye yerlestirerek kullanilabilir olmasini saglayan middleware
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => {
    console.log(`Enguide running, port number: ${port}`);
});











