import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const DBConnection = async () => {
  try {
    const connectionInstention = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\n DB Connection Successfully || DB HOST: ${connectionInstention.connection.host}`
    );
  } catch (error) {
    console.error("MONGODB FAILLED TO CONNECT ERROR", error);
    throw error;
  }
};

export default DBConnection;
