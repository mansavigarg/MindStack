import  express  from "express";
import "./models/db.js"
import cors from "cors";
import {env} from "./config/env.js"
import { connectDB } from "./models/db.js";

import userRoutes from "./routes/userRoutes.js"
import contentRoutes from "./routes/contentRoutes.js";
import publicRoute from "./routes/publicRoute.js";

const app = express();
app.use(cors())
app.use(express.json());


app.get("/health-check", (req, res) => {
    res.send("Hello World");
});


app.use("/api/v1/user", userRoutes)
app.use("/api/v1/content", contentRoutes)
app.use("api/v1", publicRoute)


try {
    connectDB();
    app.listen(env.PORT, () => {
        console.log(`Server is running at http://localhost:${env.PORT}`);
    });
} catch (error) {
    console.log("Error while conneting to localhost")
}