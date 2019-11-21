var fs = require('fs');
var GoogleSpreadsheet = require('google-spreadsheet');
var { promisify } = require('util');
const creds = require('../config/secret.json');

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
            bills[bill.userName].products.forEach(el => {
              if (el.nameFood === element.name) {
                el.amount += 1;
                return count = 1;
              }
            });
            if (count === 0) { bills[bill.userName].products.push(product); }
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
            summaryUser: {
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
    socket.on('deleteOrder', async (result) => {
      if (typeof bills[result.user] != "undefined") {
        for (let i = 0; i < bills[result.user].products.length; i++)
          if (bills[result.user].products[i].idfood === result.idfood) {
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
              summaryUser: {
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

// async with goodle sheet
async function accessSpreadsheet() {
  const doc = new GoogleSpreadsheet('1LHIwjGz6d40fD2SgnNe6z8jojYHtZFph__AnmZeTjfc');
  await promisify(doc.useServiceAccountAuth)(creds);
  const info = await promisify(doc.getInfo)();
  const sheet = info.worksheets[0];
  var order = await Object.entries(global.order);
  for (var i = 1; i < order.length; i++) {
    for (var j = 1; j < order[i].length; j++) {
      const rows = await promisify(sheet.getRows)({
        query: `iduser = ${order[i][j].idUser} and  dateofpurchase = ${getdate()}`
      })
      if (rows.length === 0) {
        let row = {
          iduser: order[i][j].idUser,
          username: order[i][j].userName,
          totalproduct: order[i][j].__summary.totalProuct,
          totalprice: order[i][j].__summary.totalPrice,
          dateofpurchase: getdate(),
          namefood: []
        }
        order[i][j].products.forEach(product => {
          row.namefood.push(product.nameFood)
        })
        await promisify(sheet.addRow)(row)
      }
      else {
        rows[0].totalproduct = await order[i][j].__summary.totalProuct;
        rows[0].totalPrice = await order[i][j].__summary.totalPrice;
        rows[0].namefood = [];
        order[i][j].products.forEach(product => {
          rows[0].namefood.push(product.nameFood)
        })
        rows[0].save();
      }
    }
  }
}
setInterval(async () => {
  accessSpreadsheet();
}, 300000)

// check new day affter 1s
setInterval(async () => {
  const doc = new GoogleSpreadsheet('1LHIwjGz6d40fD2SgnNe6z8jojYHtZFph__AnmZeTjfc');
  await promisify(doc.useServiceAccountAuth)(creds);
  const info = await promisify(doc.getInfo)();
  const sheet = info.worksheets[0];
  const rows = await promisify(sheet.getRows)({
    offset: 1
  });
  if (rows.splice(-1)[0].dateofpurchase =! getdate()) {
    console.log("New date")
    var row = {
      iduser: '',
      username: '',
      totalproduct: '',
      totalprice: '',
      dateofpurchase: '',
      namefood: ''
    }
    await promisify(sheet.addRow)(row);
    return bills = {
      __summary: {
        totalPrice: 0, totalProuct: 0
      }
    }
  }
}, 1000);

// set data in variable global
setInterval(async () => {
  global.order = bills;
}, 100);

module.exports = order
