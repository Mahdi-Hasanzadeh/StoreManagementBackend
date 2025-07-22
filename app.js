import mongoose from "mongoose";
import dotenv from "dotenv";
import server from "./index.js";

dotenv.config();

const port = process.env.PORT || 8001;

mongoose
  .connect(process.env.CONNECTION_STRING)
  .then(() => {
    console.log("App connected to database");

    server.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err.message);
  });
