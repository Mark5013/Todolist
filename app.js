const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(`${__dirname}/date.js`);
const _ =require("lodash");
require('dotenv').config();

const app = express();
const port = 3000;
const password = process.env.passKey;

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');
  

//connect to mongodb
mongoose.connect("mongodb+srv://admin-mark:Victor2002!@cluster0.vgavw.mongodb.net/todolistDB");

// Create todolist schema
const itemsSchema = new mongoose.Schema({
    name: String,
});

// Create mongoose model based off of schema
const Item = mongoose.model("item", itemsSchema);

const Item1 = new Item({
    name: "Welcome to your todolist!"
});

const Item2 = new Item({
    name: "Hit the + button to add a new item",
});

const Item3 = new Item({
    name: "Hit this to delete an item --->",
});

const defaultItems = [Item1, Item2, Item3];

// New list schema
const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema],
});

// New mongoose model
const List = mongoose.model("List", listSchema);

//cur day
let day = date.getDate();


app.get("/", (req, res) => {

    Item.find({}, function(err, results){
        if(err) {
            console.log(err);
        } else {
            if(results.length === 0) {
                // Insert arr of default items
                Item.insertMany(defaultItems, function(err) {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log("Items added successfully");
                    }
                });
                res.redirect("/");
            } else {
                //render template
                res.render('list', 
                {
                    listTitle: day,
                    newItems: results,
                });
            }
        }
    })
});

app.post("/", (req,res) => {
    // text from user
    let itemText = req.body.newItem;
    // list title
    const listTitle = req.body.list;

    // create new mongoose imem
    const newItem = new Item({
        name: itemText,
    });

    if(listTitle === day) {
        // mongoose shortcut to save to database
        newItem.save(function(err) {
            //MAKE SURE PAGE DOESN'T REDNER BEFORE ADDING TO DATABASE THIS BUG WAS ANNOYING
            if(err) {
                console.log(err);
            } else {
                res.redirect("/");
            }
        });
    } else {
        List.findOne({name: listTitle}, function(err, foundList) {
            foundList.items.push(newItem);
            foundList.save(function(err) {
                //MAKE SURE PAGE DOESN'T REDNER BEFORE ADDING TO DATABASE THIS BUG WAS ANNOYING
                if(err) {
                    console.log(err);
                } else {
                    res.redirect(`/${listTitle}`);
                }

            });
            
        });
    }
})


// Handle deletion of items
app.post("/deleteItem", (req, res) => {
    const itemId = req.body.list;
    const listTitle = req.body.listTitle;

    if(listTitle === day) {
        //home list 
        Item.findByIdAndRemove(itemId, function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("Item removed successfully!")
                res.redirect("/");
            }
        })  
    } else {
        //custom list
        List.findOneAndUpdate({name: listTitle}, {$pull: {items: {_id: itemId}}}, function(err, foundList){
            if(err) {
                console.log(err);
            } else {
                res.redirect(`/${listTitle}`);
            }
        });
    } 
})

app.get("/:topic", (req, res) => {
    const topic = _.capitalize(req.params.topic);

    List.findOne({name: topic}, function(err, foundList){
        if(err) {
            console.log(err);
        } else {
            if(!foundList) {
                // Doesn't exist, so create it
                const list = new List({
                    name: topic,
                    items: defaultItems,
                });
                list.save();
                res.redirect(`/${topic}`);
            } else {
                // Already exists, so just render page
                res.render("list", {
                    listTitle: topic,
                    newItems: foundList.items,
                })
            }
        }
    })

})

app.listen(process.env.PORT, () => {
    console.log(`listening on port: ${process.env.PORT}`);
});

