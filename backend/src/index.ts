import  express  from "express";
import "./models/db.js"
import { ResponseStatus } from "./types/responseStatus.js";
import { connectDB } from "./models/db.js";
import userRoutes from "./routes/userRoutes.js"

const app = express();
app.use(express.json());


app.use("/api/v1/user", userRoutes)


app.get("/health-check", (req, res) => {
    res.send("Hello World");
});



app.post("/api/v1/content", (req, res) => {

});

app.get("/api/v1/content", (req, res) => {

});

app.delete("/api/v1/content", (req, res) => {

});

app.post("/api/v1/brain/share", (req, res) => {

});

app.post("/api/v1/brain/share", (req, res) => {

});

app.get("/api/v1/brain/:shareLink", (req, res) => {

});

try {
    connectDB();
    app.listen(3000, () => {
        console.log("Server is running on port 3000");
    });
} catch (error) {
    console.log("Error while conneting to localhost")
}