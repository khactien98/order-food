var fs = require('fs');
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
          let data = {
            image: element.image,
            user: result.user,
            id: result.idUser,
            nameFood: element.name,
            price: element.price,
          }
          let bill = {
            userName: result.user,
            idUser: result.idUser,
            products: [
              {
                image: element.image,
                nameFood: element.name,
                price: element.price,
                restaurant: result.restaurant,
              }
            ],
            __summary: {
              totalPrice: element.price,
              totalProuct: 1
            }
          }
          let product = {
            image: element.image,
            nameFood: element.name,
            price: element.price,
            restaurant: result.restaurant,
          }
          if (typeof bills[bill.userName] === "undefined") {
            bills[bill.userName] = bill;
            bills.__summary.totalPrice += element.price;
            bills.__summary.totalProuct += 1;
          }
          else {
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


module.exports = order
