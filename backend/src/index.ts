import  express  from "express";

const app = express();


app.get("/health-check", (req, res) => {
    res.send("Hello World");
});

app.post("/api/v1/signup", (req,res) => {

})

app.post("/api/v1/signin", (req, res) => {

})

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



app.listen(3000, () => {
    console.log("Server is running on port 3000");
});