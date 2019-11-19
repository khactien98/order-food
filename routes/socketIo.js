var fs = require('fs');

//create variable storage
var bills = {};
bills.__summary = {
  totalPrice: 0, totalProuct: 0
}

const order = async (io) => {
  var product = JSON.parse(fs.readFileSync('./data/product/product.json'));
  io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('infoOrder', async (result) => {
      product.forEach(element => {
        if (element.id === result.food) {
          let bill = {
            userName: result.user,
            idUser: result.idUser,
            products: [
              {
                idfood: element.id,
                image: element.image,
                nameFood: element.name,
                price: element.price,
                restaurant: result.restaurant,
                amount: 1
              }
            ],
            __summary: {
              totalPrice: element.price,
              totalProuct: 1
            }
          }
          let product = {
            idfood: element.id,
            image: element.image,
            nameFood: element.name,
            price: element.price,
            restaurant: result.restaurant,
            amount: 1
          }
          if (typeof bills[bill.userName] === "undefined") {
            bills[bill.userName] = bill;
            bills.__summary.totalPrice += element.price;
            bills.__summary.totalProuct += 1;
          }
          else {
            let count = 0;
            bills[bill.userName].products.forEach(el =>{
              if(el.nameFood === element.name){
                el.amount +=1;
                return count = 1;
              }
            });
            if(count === 0){bills[bill.userName].products.push(product);}
            bills[bill.userName].__summary.totalPrice += element.price;
            bills[bill.userName].__summary.totalProuct += 1;
            bills.__summary.totalPrice += element.price;
            bills.__summary.totalProuct += 1;
          }
          let data = {
            idfood: element.id,
            image: element.image,
            user: result.user,
            id: result.idUser,
            nameFood: element.name,
            price: element.price,
            summaryUser:{
              totalPrice: bills[result.user].__summary.totalPrice,
              totalProuct: bills[result.user].__summary.totalProuct
            },
            __summary: {
              totalPrice: bills.__summary.totalPrice,
              totalProuct: bills.__summary.totalProuct
            }
          }
          socket.emit('order', data);
          socket.broadcast.emit("order", data)
        }
      })
    })
    socket.on('deleteOrder', async (result) =>{
      if (typeof bills[result.user] != "undefined"){
        for(let i = 0; i < bills[result.user].products.length ; i++)
          if(bills[result.user].products[i].idfood === result.idfood){
            bills[result.user].__summary.totalProuct -= bills[result.user].products[i].amount;
            bills[result.user].__summary.totalPrice -= bills[result.user].products[i].price * bills[result.user].products[i].amount;
            bills.__summary.totalPrice -= bills[result.user].products[i].price * bills[result.user].products[i].amount;
            bills.__summary.totalProuct -= bills[result.user].products[i].amount;
            bills[result.user].products.splice(i, 1);
            var data = {
              user: result.user,
              id: result.idUser,
              idfood: result.idfood,
              __summary: {
                totalPrice: bills.__summary.totalPrice,
                totalProuct: bills.__summary.totalProuct
              },
              summaryUser:{
                totalPrice: bills[result.user].__summary.totalPrice,
                totalProuct: bills[result.user].__summary.totalProuct
              },
            }
            socket.emit('orderDele', data);
            socket.broadcast.emit("orderDele", data);
          }
      }
    })
    socket.on('disconnect', function () {
      console.log('user disconnected');
    });
  });
}

function getdate() {
  var dateObj = new Date();
  var month = dateObj.getUTCMonth() + 1; //months from 1-12
  var day = dateObj.getUTCDate();
  var year = dateObj.getUTCFullYear();
  newdate = year + "-" + month + "-" + day;
  return newdate;
}

setTimeout(() => {
  let date = getdate();
  fs.writeFileSync(`./data/bill/${date}_datcom.json`, JSON.stringify(bills), 'utf8');
}, 60000);

setInterval(async () => {
  let date = getdate();
  var oder = JSON.parse(fs.readFileSync(`./data/bill/${date}_datcom.json`));
  if (JSON.stringify(oder) === JSON.stringify(bills)) {
    console.log('constant file')
  }
  else {
    fs.writeFileSync(`./data/bill/${date}_datcom.json`, JSON.stringify(bills), 'utf8');
    console.log('write file')
  }
}, 120000);

setInterval(async () => {
  var date = getdate();
  if (!fs.existsSync(`./data/bill/${date}_datcom.json`)) {
    console.log("New day");
    fs.writeFileSync(`./data/bill/${date}_datcom.json`, JSON.stringify({__summary:{totalPrice:0,totalProuct:0}}), 'utf8');
    return bills = {
      __summary: {
        totalPrice: 0, totalProuct: 0
      }
    }
  }
}, 1000);
setInterval(async () => {
  global.order = bills;
}, 100);

module.exports = order
