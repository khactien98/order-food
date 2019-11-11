var fs = require('fs');
var bills = {};
bills.__summary = {
  totalPrice: 0, totalProuct: 0
}
const order  =async (io) => {
  var product = JSON.parse(fs.readFileSync('./data/product/product.json'));
  io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('infoOrder', async (result) => {
      var user = await JSON.parse(result.user);
          product.forEach(element => {
            if (element.id === result.food) {
              let data = {
                image: element.image,
                user: user.userName,
                phone: user.phone,
              }
              let bill = {
                userName: user.userName,
                address: user.address,
                phone: user.phone,
                products: [
                    {
                        nameFood: element.name,
                        price: element.price,
                        restaurant: result.restaurant
                    }
                ],
                __summary: {
                  totalPrice:  element.price,
                  totalProuct: 1
              }
            }
            let product = {
              nameFood: element.name,
              price: element.price,
            }
            if(typeof bills[bill.userName] === "undefined"){          
              bills[bill.userName] = bill;
              bills.__summary.totalPrice += element.price;
              bills.__summary.totalProuct += 1;
            }
            else{
              bills[bill.userName].products.push(product);
              bills[bill.userName].__summary.totalPrice += element.price;
              bills[bill.userName].__summary.totalProuct += 1;
              bills.__summary.totalPrice += element.price;
              bills.__summary.totalProuct += 1;
            }
              socket.emit('order', data);
              socket.broadcast.emit("order", data)
            }
          })
    })
    socket.on('disconnect', function () {
      console.log('user disconnected');
    });
  });
}

function getdate(){
  var dateObj = new Date();
  var month = dateObj.getUTCMonth() + 1; //months from 1-12
  var day = dateObj.getUTCDate();
  var year = dateObj.getUTCFullYear();
  newdate = year + "-" + month + "-" + day;
  return newdate;
}

setTimeout(() =>{
  let date = getdate();
  fs.writeFileSync(`./data/bill/${date}_datcom.json`, JSON.stringify(bills), 'utf8');
}, 60000);

setInterval(async () =>{
  let date = getdate();
  var oder = JSON.parse(fs.readFileSync(`./data/bill/${date}_datcom.json`));
  if( JSON.stringify(oder) === JSON.stringify(bills) ){
    console.log('constant')
  }
  else{
    console.log('write file')
    fs.writeFileSync(`./data/bill/${date}_datcom.json`, JSON.stringify(bills), 'utf8');
  }
},240000);

setInterval(async () =>{
  var date = getdate();
  if(!fs.existsSync(`./data/bill/${date}_datcom.json`)){
    console.log("New day");
    fs.writeFileSync(`./data/bill/${date}_datcom.json`,'', 'utf8');
    return bills = {
      __summary : {
        totalPrice: 0, totalProuct: 0
      }
    }
  }
},1000);


module.exports = order
