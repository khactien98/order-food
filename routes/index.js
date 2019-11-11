var express = require('express');
var router = express.Router();
var fs = require('fs');


router.get('/', async (req, res, next) =>{
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
        //console.log(produ)
      }
    }
  }
  res.render('show.ejs', {data: {product: produ, restaurant: restaurant}});
});


router.get('/login', async (req, res) =>{
  res.render('login.ejs')
})

router.get('/:id', async (req, res) =>{
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
  res.render('shop', {data: {product: produ, restaurant: restaurant, detail: restau}});
})

module.exports = router;
