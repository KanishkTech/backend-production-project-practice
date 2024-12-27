import dotenv from "dotenv";
import DBConnection from "./db/index.js";
import app from "./app.js";

dotenv.config({
  path: "./env",
});

DBConnection()
  .then(() => {
    app.on("error", (err) => {
      console.error("Server failed to start", err);
      throw err;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.error("Server failed to start", err);
  });
