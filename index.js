require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_CONNECT);
const path = require('path');
const morgan = require('morgan');

const nocache = require('nocache');

const express = require('express');
const app = express();

const port = process.env.PORT

app.use(nocache());
/** For User Route */
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, '/public/assets')));

const userRoute = require('./routers/userRoute');
app.use('/', userRoute); 
app.use(express.json());

app.set('view engine', 'ejs');
app.use(morgan('dev'));
/** For Admin Route */
const adminRoute = require('./routers/adminRoute'); 
app.use('/admin', adminRoute);

const errorHandler = require('./middleware/errorHandler');

app.use(errorHandler);
app.use((req, res) => {
    res.status(404).render('404')
})

app.listen(port, () => { console.log(`Server listening on: http://localhost:${port}/`) }) 