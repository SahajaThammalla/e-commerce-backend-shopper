const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { strict } = require("assert");
const { log } = require("console");

app.use(express.json());
app.use(cors());

// database connection with mongoDb
mongoose.connect("mongodb+srv://sahaja:sahaja123@cluster0.wi5mw.mongodb.net/e-commerce")

// api
app.get("/",(req,res)=>{
    res.send("Express app is running")
})

const storage = multer.diskStorage({
    destination : './upload/images',
    filename:(req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})
const upload = multer({storage:storage})

app.use('/images',express.static('upload/images'))

app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:${port}/images/${req.file.filename}`
    })
})

const Product = mongoose.model("Product",{
    id:{
        type: Number,
        required: true,
    },
    name:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    new_price:{
        type:Number,
        required:true,
    },
    old_price:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    available:{
        type:Boolean,
        default:true,
    }
})

app.post('/addproduct',async (req,res)=>{
    let products = await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1;
    }
    else{
        id=1;
    }
        const product = new Product({
            id:id,
            name:req.body.name,
            image:req.body.image,
            category:req.body.category,
            new_price:req.body.new_price,
            old_price:req.body.old_price,
        });
        console.log(product);
        await product.save();
        console.log("saved");
        res.json({
            success:true,
            name:req.body.name,
        })
})

const Users = mongoose.model('User',{
    name:{
        type:String,

    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now, 
    }
})

app.post('/signup',async (req,res)=>{
    let check = await Users.findOne({email:req.body.email});
    if (check) {
        return res.status(400).json({success:false,errors:"existing user email"})
    }
    let cart = {};
    for (let i=0; i< 300; i++){
        cart[i]=0;
    }
    const user = new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData: cart,
    })

    await user.save();

    const data = {
        user:{
            id:user.id
        }
    }

    const token = jwt.sign(data,'secret_ecom');
    res.json({success:true,token})
})

app.post('/login',async(req,res)=>{
    let user = await Users.findOne({email:req.body.email});
    if(user){
        const passCompare = req.body.password === user.password;
        if (passCompare){
            const data = {
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data,'secret_ecom');
            res.json({success:true,token});
        }
        else {
            res.json({success:false,errors:"wrong password"});
        }
    }
    else{
        res.json({success:false,errors:"wrong email"});
    }
})

const fetchUser = async (req,res,next)=>{
    const token = req.header('auth-token');
    if(!token){
        res.status(401).send({errors:"please authenicate using valid token"})
    }
    else{
        try {
            const data = jwt.verify(token,'salt_ecom');
            req.user - data.user;
            next();
        } catch (error) {
            res.status(401).send({errors:"please authenicate usingg valid token"})
        }
    }
}

app.listen(port,(error)=>{
    if(!error){
        console.log("server is running on port "+port)
    }
    else{
        console.log("Error :"+error)
    }
})