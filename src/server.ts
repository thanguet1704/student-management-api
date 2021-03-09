import express from 'express';
const app = express();

app.get('/', (req, res) => {
    res.send('sdjfj');
});

app.listen(3000, () => {
    console.log('server starting');
});
