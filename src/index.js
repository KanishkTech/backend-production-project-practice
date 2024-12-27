import dotenv from 'dotenv';
import DBConnection from './db/index.js';

dotenv.config({
    path:"./env"
});

DBConnection();