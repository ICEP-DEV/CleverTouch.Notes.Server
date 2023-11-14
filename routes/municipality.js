const express =require('express');
const bodyparser=require('body-parser');
const cors = require('cors');
const router = express.Router();
const app=express();
const connection = require("../config/config");
const multer = require('multer');
const path = require('path');
require('dotenv').config();


// Set up Multer to handle file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Specify the upload directory
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Use unique filenames
    },
  });
  
  const upload = multer({ storage: storage });

  // Serve static files from the 'uploads' directory
router.use('/uploads', express.static('uploads'));



router.post('/addEvents',upload.single('image'),(req, res)=>{
    const title = req.body.title;
    const description=req.body.description;
    const date=req.body.date;
    const venue=req.body.venue;
    let image="";
    if (req.file) {
         image = `http://localhost:${process.env.PORT}/api/uploads/${req.file.filename}`;
        // http://localhost:${process.env.PORT}/uploads/${req.file.filename}
    }
      // }else{
      //   return res.status(400).send('No file uploaded.');
      // }
    
    //
    let sql=`INSERT INTO EVENTS(title,description,date,venue,image)
    VALUES('${title}','${description}','${date}','${venue}','${image}')`
    
    connection.query(sql,(err, results)=>{
        if(err){
            return res.status(400).send("Failed to  add events!"+err);
        }
        else{
                return res.status(200).send("Events added succesfully");

            }
    });




})
//get all events
router.get('/getEvents',(req,res)=>{
  let sql=`select * FROM EVENTS`
  connection.query(sql,(err, results)=>{
    if(err){
        return res.status(400).send("Failed to retrieve events!"+err);
    }
    else{
            return res.status(200).send(results)

        }
  });

})


// Handle GET request to retrieve an image only by filename
router.get('/uploads/:filename', (req, res) => {
  const { filename } = req.params;

  res.sendFile(path.join(__dirname, 'uploads', filename));
  
});

module.exports = router;