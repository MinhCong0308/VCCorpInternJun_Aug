const app = require("./index");

const port = 3000;

app.listen(port, () => {
    console.log(`Running on http://localhost:${port}`);
});