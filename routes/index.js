var express = require('express');
var router = express.Router();
var fs = require('fs');
const NodeCache = require( "node-cache" );
const myCache = new NodeCache();


router.get('/',async (req, res) =>{

  function getdate(){
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    newdate = year + "-" + month + "-" + day;
    return newdate;
  }
    //var listOder = await JSON.parse(fs.readFileSync(`./data/bill/${getdate()}_datcom.json`));
    var order = await Object.entries(global.order);
  var product = await JSON.parse(fs.readFileSync('./data/product/product.json'));
  var restaurant = await JSON.parse(fs.readFileSync('./data/restaurant/restaurant.json'));
  let produ = [];
  
  for(let i = 0; i < product.length; i++){
    for(let j = 0 ; j < restaurant.length; j++){
      if(product[i].idRestaurant == restaurant[j].id){
        let data = {
          prod: product[i],
          restaurant: restaurant[j]
        }
        produ.push(data);
      }
    }
  }
  res.render('manage.ejs',{data: {product: produ, restaurant: restaurant, listOder: order}})
})


router.get('/:id', async (req, res) =>{
  function getdate(){
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    newdate = year + "-" + month + "-" + day;
    return newdate;
  }
    //var listOder = await JSON.parse(fs.readFileSync(`./data/bill/${getdate()}_datcom.json`));
    var order = await Object.entries(global.order);
  var product = await JSON.parse(fs.readFileSync('./data/product/product.json'));
  var restaurant = await JSON.parse(fs.readFileSync('./data/restaurant/restaurant.json'));
  let produ = [];
  let restau ;
  product.forEach(element => {
    if(element.idRestaurant == req.params.id)
    produ.push(element);
  });
  restaurant.forEach(element => {
    if(element.id == req.params.id)
    restau = element.name;
  });
  res.render('typeProduct', {data: {product: produ, restaurant: restaurant, detail: restau, listOder: order}});
})


module.exports = router;
