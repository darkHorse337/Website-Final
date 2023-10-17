const getJSONString = function(obj) { return JSON.stringify(obj, null, 2);}

const express = require ('express'); 
const bcrypt = require("bcrypt");
const app = express(); 
const layouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const session = require('express-session');
const flash = require('connect-flash');
app.set('view engine', 'ejs');
app.use(layouts);
app.use(express.static("public"));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://127.0.0.1:27017/cis485",{useUnifiedTopology: true,useNewUrlParser: true });

var loginSchema = new mongoose.Schema({
    userid: String,
    password: String
});

var cartSchema = new mongoose.Schema({
	userid:String,
	code: String,
    name: String,
    price:Number,
    quantity:Number
});

var User = mongoose.model("login", loginSchema);
var Cart = mongoose.model("cart", cartSchema);

app.use(session({
  'secret': '1234567',
  resave: true,
   saveUninitialized: true
}))

app.use(express.json());
app.use(cookieParser("secret_passcode"));
app.use(flash());

app.use((req, res, next) => {
  console.log(`request made to: ${req.url}`);
  next();
});

app.get ("/", function (req,res){
    let x=req.flash("message");
    res.render ( "login.ejs",{message:x,flag:""});
});


app.get ("/login", function (req,res){
    let x=req.flash("message");
    res.render ( "login.ejs",{message:x,flag:""});
});


app.get ("/registration", function (req,res){
    let x=req.flash("message");
    res.render ( "registration.ejs",{message:x,flag:""});
});


app.get ("/about", function (req,res){
    if(req.session.flag =="1")
        res.render ( "about.ejs",{message:"",flag:"1"});
    else{
        req.flash('message', 'ERROR: Must Login First');
        res.redirect ( "login");
    }
});

app.get ("/products", function (req,res){
    if(req.session.flag =="1")
        res.render ( "products.ejs",{message:"",flag:"1"});
    else{
        req.flash('message', 'ERROR: Must Login First');
        res.redirect ( "login");
    }
});

app.get ("/contact", function (req,res){
    if(req.session.flag =="1")
        res.render ( "contact.ejs",{message:"",flag:"1"});
    else{
        req.flash('message', 'ERROR: Must Login First');
        res.redirect ( "login");
    }
});

app.get ("/logoff", function (req,res)
{
    if(req.session.flag =="1")
        res.render ( "logoff.ejs",{message:"",flag:"1"});
    else res.render ( "login.ejs",{message:"Must Login First",flag:""});
} );

app.get("/register", (req, res) =>
{
    User.findOne({userid:req.query.userid}, '', function (err, data)
    {
        if (err) return handleError(err);
        if (data==null)
        {       
            bcrypt.hash(req.query.password, 5, function (err,hashpass)
            {
                console.log(hashpass);
                req.query.password=hashpass;
                var x = new User(req.query);
                x.save(function (err)
                { 
                    if (err) return handleError(err);
                    req.flash('message', 'User Stored In Database');
                    res.redirect ( "login");
                });
            });
        }
        else
        {
            req.flash('message', 'ERROR: User Already In Database');
            res.redirect ( "registration");
        }
    });
});

app.get("/loginx", (req, res) => {
    User.findOne({userid:req.query.userid}, '', function (err, data){
        if (err) return handleError(err);
        if (data==null){
            if (err) return handleError(err);
            req.flash('message', 'ERROR: Invalid Login Information');
            res.redirect ( "login");            
        }
        else{
           bcrypt.compare(req.query.password, data.password,function (err, result) {
                   if (result) {
                       req.session.flag = "1";
                       req.session.userid = req.query.userid;
                       res.render("products.ejs", { flag: "1", message: "" });
                   }
                   else {
                       req.flash('message', 'ERROR: Invalid Password');
                       res.redirect("login");
                   }
               });
        }
    });
});


app.post("/logoff", (req, res) =>
{
    console.log("POST LOGOFF");
    req.session.destroy(function(err)
    {
        res.redirect ( "login");
    });
});
app.post("/add", (req, res) => 
{
	console.log("body="+getJSONString(req.body));
	var msg="No MSG";
	var flag=0;
	var message="";
	const item2find = new Object();
	item2find.code=req.body.code;
	item2find.userid=req.session.userid;
	
    Cart.find(item2find, '', function (err, data) {
		
        if (err) return handleError(err);
		console.log("result="+getJSONString(data));
		if(data=="") console.log("EMPTY");
		
		var code=req.body.code;
		var name=req.body.name;
		var price=req.body.price;
		var quantity=req.body.quantity;
		var userid=req.session.userid;
		
		console.log("flag="+flag);
		if(data==""){
			const item = new Object();
			item.userid=userid;
			item.code=code;
			item.name=name;
			item.price=price;
			item.quantity=quantity;
			var x = new Cart(item);
			
		x.save(function (err) {
				if (err) return handleError(err);
				var message="Iteim Added to Web Cart";
				console.log(message);
			});
		}
		else {
			const item2update = new Object();
			item2update.code=req.body.code;
			item2update.userid=req.session.userid;
			console.log("UPDATE QTY="+data[0].quantity);
			var quantity=parseInt(data[0].quantity)+1;
			const update=new Object();
			update.quantity=quantity;
			Cart.updateOne(item2update, update,function(err,result)
			{
				if(err) console.log("ERROR="+err);
				else console.log("RECORD UPDATED"); 
			});
		}
		res.render ( "products.ejs",{flag:req.session.flag,message:""});
	});
});
app.get("/cart", (req, res) => 
{
	console.log("body="+getJSONString(req.body));
	var msg="No MSG";
	var flag=0;
	var message="";
	const item2find = new Object();
	item2find.userid=req.session.userid;
	
    Cart.find(item2find, '', function (err, data) 
    {
		var cart=""
		if (err) return handleError(err);
		console.log("result="+getJSONString(data));
		if(data=="") console.log("EMPTY");
		console.log("flag="+flag);
		if(data==""){
			var cart="CART EMPTY<br><a href='/products'>Back To Shopping</a>";
			res.render ( "cart.ejs",{cart:cart,flag:req.session.flag,message:""});
		}
		else{
		    cart="<div class='cart'> <table style='background-color:white'><tr><th>ITEM</th><th>NAME</th><th>QTY</th><th>PRICE</th><th>SUBTOTAL</th></tr>";
			var total=0;
			for(var i=0;i<data.length;i++){
				var image=data[i].code+".png";
			    cart+="<tr><td><img width='60px' src='"+image+"' /></td><td>"+data[i].name+"</td><td><div style='vertical-align: middle;'><form style='float:left' method=post action='/change'><input style='float:left' type=hidden name=code value='"
				+data[i].code+"' /><input size=1 type=text name=quantity style='float:left' value='"+data[i].quantity+"' /><input type=submit value=Update  /></form>"
				+"<a href='/delete:"+data[i].code+"' style='float:left'><img src='x.png' width='20px'style='float:left'/></a></div></td><td class='right'>$"
				+data[i].price.toFixed(2)+"</td><td class='right'>$"+(parseFloat(data[i].price)*parseInt(data[i].quantity)).toFixed(2)+"</td></tr>";
				total=total+(parseFloat(data[i].price)*parseInt(data[i].quantity));
			}
			cart+="<tr><td style='background:black;color:white' colspan=4>GRAND TOTAL:</td><td class='right'>$"+total.toFixed(2) +"</td></tr>"
			cart+="</table></div>";
			if(total ==0) cart+="<br><a href='/products'>GO BACK SHOPPING</a>";
			else cart+="<br><div 'class=cart' style='width:100%;text-align:center'><a href='/checkout'>Checkout</a></div>"
			res.render ( "cart.ejs",{cart:cart,flag:req.session.flag,message:""});
		}
		
	});
});
app.post("/change", (req, res) => {
       const item2find = new Object();
       item2find.code=req.body.code;
       item2find.userid=req.session.userid;
       Cart.find(item2find, '', function (err, data){
          if (err) return handleError(err);
          var qty=parseInt(req.body.quantity);
          if(qty<=0){
            Cart.findOneAndDelete(item2find, function (err){
                if(err) console.log(err);
                console.log("Successful deletion");
             }); 
        }
        else {
            const item2update = new Object();
            item2update.code=req.body.code;
            item2update.userid=req.session.userid;
            const update=new Object();
            update.quantity=req.body.quantity;
            Cart.updateOne(item2update, update,function(err,result){
                if(err) console.log("ERROR="+err);
                else console.log("RECORD UPDATED");
               });
            }
            res.redirect('/cart');
        });
});
app.get("/delete:code", (req, res) =>{
      const item2find = new Object();
      console.log("param="+req.params.code);
      var code=req.params.code.substring(1);
      console.log("code="+code);
      item2find.code=code;
      item2find.userid=req.session.userid;
        Cart.findOneAndDelete(item2find, function (err){
            if(err) console.log(err);
            console.log("Successful deletion");
        });
      res.redirect('/cart');
});

app.get("/checkout", (req, res) =>{
    const item2delete = new Object();
    item2delete.userid=req.session.userid;
    Cart.deleteMany(item2delete, function (err){
        if(err) console.log(err);
        console.log("Successful Cart Deletion");
      });
    res.render ( "checkout.ejs",{flag:req.session.flag,message:""});
});

app.listen(3000 , function () {
	console.log ("server is listening!!!");
} );
