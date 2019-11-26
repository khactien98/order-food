var fs = require('fs');
var Queue = require('better-queue');
var GoogleSpreadsheet = require('google-spreadsheet');
var { promisify } = require('util');
const creds = require('../config/secret.json');

//create variable storage
var bills = {};
bills.__summary = {
  totalPrice: 0, totalProuct: 0
}
// create valible save google sheet
var createRow = [];
var deletes = [];
const order = async (io) => {
  var product = JSON.parse(fs.readFileSync('./data/product/product.json'));
  io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('infoOrder', async (result) => {
      product.forEach(async element => {
        if (element.id === result.food) {
          // push bill in valible google sheet
          createRow.push({
            iduser: result.idUser,
            idfood: element.id,
            username: result.user,
            totalproduct: 1,
            totalprice: element.price,
            namefood: element.name
          })
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
          // if user not exit in bill
          if (typeof bills[bill.userName] === "undefined") {
            // push bills  in valible global
            bills[bill.userName] = bill;
            bills.__summary.totalPrice += element.price;
            bills.__summary.totalProuct += 1;
          }
          // if user exit in bill
          else {
            let count = 0;
            bills[bill.userName].products.forEach(el => {
              // if exit product, then plus amount 
              if (el.nameFood === element.name) {
                el.amount += 1;
                return count = 1;
              }
            });
            // if not exits product, then push product in user
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
            deletes.push({
              iduser: result.idUser,
              idfood: result.idfood,
              username: result.user,
              totalproduct: bills[result.user].products[i].amount,
              totalprice: bills[result.user].products[i].price,
              namefood: bills[result.user].products[i].nameFood
            })

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
  var month = dateObj.getMonth() + 1; //months from 1-12
  var day = dateObj.getDate();
  var year = dateObj.getFullYear();
  newdate = year + "-" + month + "-" + day;
  return newdate;
}

// function create with goodle sheet
async function createSpreadsheet(iduser, idfood, username, namefoods, amount, price) {
  const doc = new GoogleSpreadsheet('1LHIwjGz6d40fD2SgnNe6z8jojYHtZFph__AnmZeTjfc');
  await promisify(doc.useServiceAccountAuth)(creds);
  const info = await promisify(doc.getInfo)();
  const sheet = info.worksheets.slice(-1)[0];
  const rows = await promisify(sheet.getRows)({
    query: `iduser = ${iduser} and  dateofpurchase = ${getdate()} and idfood = ${idfood}`
  })
  if (rows.length === 0) {
    let row = {
      iduser: iduser,
      idfood: idfood,
      username: username,
      totalproduct: amount,
      totalprice: price,
      dateofpurchase: getdate(),
      namefood: [namefoods]
    }
    await promisify(sheet.addRow)(row)
  }
  else {
    rows[0].totalproduct = parseInt(rows[0].totalproduct) + parseInt(1);
    rows[0].totalPrice = parseInt(rows[0].totalprice) + parseInt(price);
    rows[0].save();
  }
}

// function delete with goodle sheet
async function deleteSpreadsheet(iduser, idfood, username, namefoods, amount, price) {
  const doc = new GoogleSpreadsheet('1LHIwjGz6d40fD2SgnNe6z8jojYHtZFph__AnmZeTjfc');
  await promisify(doc.useServiceAccountAuth)(creds);
  const info = await promisify(doc.getInfo)();
  const sheet = info.worksheets.slice(-1)[0];
  const rows = await promisify(sheet.getRows)({
    query: `iduser = ${iduser} and  dateofpurchase = ${getdate()} and idfood = ${idfood}`
  })
  if (rows[0].totalproduct > amount) {
    rows[0].totalproduct = parseInt(rows[0].totalproduct) - parseInt(amount);
    rows[0].totalPrice = parseInt(rows[0].totalprice) - parseInt(price) * parseInt(amount);
    rows[0].save();
  }
  else {
    rows[0].del();
  }
}

// check new month in google sheet
setInterval(async () => {
  var dateObj = new Date();
  var month = dateObj.getMonth() + 1; //months from 1-12
  var year = dateObj.getFullYear();
  if (dateObj.getDate() === 1) {
    const doc = new GoogleSpreadsheet('1LHIwjGz6d40fD2SgnNe6z8jojYHtZFph__AnmZeTjfc');
    await promisify(doc.useServiceAccountAuth)(creds);

    doc.addWorksheet({
    }, function (err, sheet) {
      // change a sheet's title
      sheet.setTitle(year + "-" + month); //async
      //resize a sheet
      sheet.resize({ rowCount: 1656, colCount: 20 }); //async
      sheet.setHeaderRow(['Id User', 'Id food', 'User Name', 'Name Food', 'Total Product', 'Total Price', 'Date of Purchase']); //async
    })
  }
}, 500)


// check new day in google sheet
setInterval(async () => {
  try {
    const doc = new GoogleSpreadsheet('1LHIwjGz6d40fD2SgnNe6z8jojYHtZFph__AnmZeTjfc');
    await promisify(doc.useServiceAccountAuth)(creds);
    const info = await promisify(doc.getInfo)();
    const sheet = info.worksheets.slice(-1)[0];
    const rows = await promisify(sheet.getRows)({
      offset: 1
    });
    if (typeof rows.splice(-1)[0] != 'undefined') {
      var date = rows.splice(-1)[0].dateofpurchase;
      if (date != getdate() && date.length != 1) {
        console.log("New date")
        var row = {
          iduser: ' ',
          idfood: ' ',
          username: ' ',
          totalproduct: ' ',
          totalprice: ' ',
          dateofpurchase: ' ',
          namefood: ' '
        }
        await promisify(sheet.addRow)(row);
        return bills = {
          __summary: {
            totalPrice: 0, totalProuct: 0
          }
        }
      }
    }
  } catch (error) {
    console.log(error)
  }

}, 10000);

// create bill in google sheet
setInterval(async () => {
  try {
    let createRows = createRow;
    createRow = [];
    if (createRows.length != 0) {

      for (let i = 0; i < createRows.length; i++) {
        setTimeout(() => {
          createSpreadsheet(createRows[i].iduser, createRows[i].idfood, createRows[i].username, createRows[i].namefood, 1, createRows[i].totalprice)
        }, i * 2000);
      }
    }
  } catch (error) {
    console.log('errr')
  }
}, 60000);

// delete bill in google sheet
setInterval(async () => {
  try {
    let deleterows = deletes;
    deletes = [];
    if (deleterows.length != 0) {

      for (let i = 0; i < deleterows.length; i++) {
        setTimeout(() => {
          console.log(deleterows[i])
          deleteSpreadsheet(deleterows[i].iduser, deleterows[i].idfood, deleterows[i].username, deleterows[i].namefood, deleterows[i].totalproduct, deleterows[i].totalprice)
        }, i * 2000);
      }
    }
  } catch (error) {
    console.log('errr')
  }
}, 120000);

// set data in variable global
setInterval(async () => {
  global.order = bills;
}, 100);

module.exports = order
