import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // Allow cookies or authentication headers to be sent from the client side of the request (default is false)
  })
);
app.use(express.json({ limit: "16kb" })); //this sets the limit of the request body to 16kb
app.use(express.urlencoded({ extended: true, limit: "16kb" })); //
app.use(express.static("public"));
app.use(cookieParser());

//import routes
import userRouter from './routes/user.routes.js'

app.use("/api/v1/users", userRouter); //localhost:PORT(3000)/api/v1/users/---


export default app;
