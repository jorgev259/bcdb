/* global lf, gapi, ReactDOM, toastr */
/* eslint-disable no-unused-vars */
var keys = 1
var startFlag = true
let columns = {}
let item

toastr.options = {
  'closeButton': true,
  'debug': false,
  'newestOnTop': false,
  'progressBar': false,
  'positionClass': 'toast-top-right',
  'preventDuplicates': true,
  'onclick': null,
  'showDuration': '300',
  'hideDuration': '1000',
  'timeOut': '0',
  'extendedTimeOut': '0',
  'showEasing': 'swing',
  'hideEasing': 'linear',
  'showMethod': 'fadeIn',
  'hideMethod': 'fadeOut'
}

var schemaBuilder = lf.schema.create('registro', 1)
var db
var table = schemaBuilder.createTable('registro')
let updateSignInStatus
var loadRowsRegistro

function start () {
  gapi.client.init({
    'clientId': '962014078288-k20v83vvqht86uq4krpehog77ielnqtk.apps.googleusercontent.com',
    'scope': 'https://www.googleapis.com/auth/spreadsheets',
    'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest']
  }).then(function () {
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus)
    updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get())
  })
}

function handleSignInClick (event) {
  gapi.auth2.getAuthInstance().signIn()
}

function handleSignOutClick (event) {
  gapi.auth2.getAuthInstance().signOut()
}

// loadSheetsregsitro => handleSheets

async function loadSheetsRegistro () {
  let res = await gapi.client.sheets.spreadsheets.get({
    spreadsheetId: '14b40B-ISEAX_CrM6mcHuB-ceSzmQO9iqbDGMMcymdkQ'
  })
  await handleSheets(res)
}

function handleSheets (response) {
  var ranges = response.result.sheets.map(e => `'${e.properties.title}'`)
  gapi.client.sheets.spreadsheets.values.batchGet({
    spreadsheetId: '14b40B-ISEAX_CrM6mcHuB-ceSzmQO9iqbDGMMcymdkQ',
    ranges: ranges
  }).then(async (response) => {
    let sheets = response.result.valueRanges

    sheets[0].values[0].forEach(column => {
      let processed = column.toLowerCase().trim().replace(' ', '_')
      columns[processed] = column
      table.addColumn(processed, lf.Type.STRING)
    })
    table.addNullable(Object.keys(columns))
    db = await schemaBuilder.connect({ storeType: lf.schema.DataStoreType.MEMORY })
    item = db.getSchema().table('registro')

    ReactDOM.render(
      Filter(columns),
      document.getElementById('filter')
    )

    Promise.all(sheets.map(handleSheet)).then(loadRowsRegistro)
  })
}

function handleSheet (sheet) {
  return new Promise((resolve, reject) => {
    let rows = sheet.values.slice(1)
    let entries = rows.map(entry => {
      var entryObject = {}
      let columnNames = Object.keys(columns)
      for (var i = 0; i < entry.length; i++) {
        entryObject[columnNames[i]] = entry[i]
      }
      return db.insert().into(item).values([item.createRow(entryObject)]).exec()
    })

    Promise.all(entries).then(() => resolve())
  })
}
