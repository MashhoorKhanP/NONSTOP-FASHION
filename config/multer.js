const express = require('express')
const path = require('path');
const multer = require('multer');


const storage = multer.diskStorage({

    destination: ((req, file, cB) => { /** cB refers the CallBack */

        cB(null, path.join(__dirname, '../public/assets/product-images'))
    }),
    filename: ((req, file, cB) => {


        const fileName = Date.now() + '-' + file.originalname;
        cB(null, fileName);
    })
});

const upload = multer({

    storage: storage,
    imageLimit: 4
})

module.exports = upload; 