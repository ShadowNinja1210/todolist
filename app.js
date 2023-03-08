const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// -------------------------------------
// Mongoose or MongoDB (Connecting)
mongoose.connect("mongodb://127.0.0.1:27017/todolistDb");

// -------------------------------------
// Mongoose Schema
const itemSchema = new mongoose.Schema({
  itemName: String,
});

const listSchema = new mongoose.Schema({
  name: String,
  itemList: [itemSchema],
});

// -------------------------------------
// Mongoose Model
const Item = mongoose.model("Item", itemSchema);

const List = mongoose.model("List", listSchema);

// -------------------------------------
// Objects
const item1 = new Item({
  itemName: "Welcome to your To-Do List",
});

const item2 = new Item({
  itemName: "Hit the + button to add items",
});

const item3 = new Item({
  itemName: "<-- Hit this button to delete the item",
});

const defaultItems = [item1, item2, item3];

// -------------------------------------
// Item insertion to the database
app.get("/", function (req, res) {
  Item.find({})
    .then((docs) => {
      // Checking if there is anything in docs
      if (docs.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("Successfully inserted the default items to the Database");
          })
          .catch((err) => {
            console.log(err);
          });
        res.redirect("/");
      }
      res.render("list", { listTitle: "Today", newListItems: docs });
    })
    .catch((err) => {
      console.log(err);
    });
});

// -------------------------------------
// Deleting the items from the lists
app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  console.log(checkedItemId);
  const listName = _.capitalize(req.body.listName);

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemId)
      .then(() => {
        console.log("Successfully deleted the checked item from database");
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    List.findById(checkedItemId)
      .then((foundItem) => {
        console.log("The found item is " + foundItem);
      })
      .catch((err) => {
        console.log(err);
      });
    List.findOneAndUpdate({ _id: checkedItemId }, { $pull: { itemList: { _id: checkedItemId } } })
      .then(() => {
        console.log("Successfully deleted the checked item from " + listName);
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

// -------------------------------------
// Entering new items in the lists
app.post("/", function (req, res) {
  const newItemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    itemName: newItemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.itemList.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

// -------------------------------------
// Creating a new list through dynamic routing
app.get("/:customListName", (req, res) => {
  const newListName = _.capitalize(req.params.customListName);
  List.findOne({ name: newListName })
    .then((foundList) => {
      if (!foundList) {
        const list = new List({
          name: newListName,
          itemList: defaultItems,
        });
        list.save();
        res.redirect("/" + newListName);
        console.log("Successfully saved " + newListName + "'s items");
      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.itemList });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

// -------------------------------------
// ABOUT PAGE
app.get("/about", function (req, res) {
  res.render("about");
});

// -------------------------------------
// CONNECTING ON PORT 3000
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
