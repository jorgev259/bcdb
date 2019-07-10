/* global gapi, ReactDOM, React, UUID, db, keys, item, start, lf, loadSheetsRegistro, toastr startFlag, $, updateSignInStatus. handleSignInClick, loadRowsRegistro, React */
/* eslint-disable no-global-assign, no-native-reassign */
updateSignInStatus = function (isSignedIn) {
  if (isSignedIn) loadSheetsRegistro().then(() => $('#_fecha').val('2019-06-30'))
  else if (startFlag) handleSignInClick()
  else {
    ReactDOM.render(
      Table([]),
      document.getElementById('root')
    )

    ReactDOM.render(
      Filter({}),
      document.getElementById('filter')
    )
  }

  startFlag = false
}

loadRowsRegistro = function () {
  $('.inputChange').change(function (event) {
    if (event.persist) event.persist()
    let value = $('#_fecha').val()
    if (event.static) value = event.target.value

    gapi.client.sheets.spreadsheets.get({
      spreadsheetId: '1BTcZbLAWkyx6Mj9lLY-qscTUP0STs8epPz1zKgGs7fk'
    }).then(async res => {
      let sheetReady = res.result.sheets.some(e => e.properties.title === value)
      if (!sheetReady) {
        var batchUpdateRequest = {
          requests: [{
            'addSheet': {
              'properties': {
                'title': value
              }
            }
          }]
        }

        let response = await gapi.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId: '1BTcZbLAWkyx6Mj9lLY-qscTUP0STs8epPz1zKgGs7fk',
          resource: batchUpdateRequest
        })

        let rows = (await db.select().from(item).exec()).map(e => {
          let row = Object.keys(e).slice(0, keys).map(e2 => e[e2])
          row.push('Presente')
          return row
        })

        await gapi.client.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: '1BTcZbLAWkyx6Mj9lLY-qscTUP0STs8epPz1zKgGs7fk'
        }, {
          valueInputOption: 'RAW',
          data: [{ values: rows, range: `'${response.result.replies[0].addSheet.properties.title}'` }]
        })
      }

      let inputs = $('.inputChange').filter(function () { return this.value !== '' && this.id !== '_fecha' }).map(function () {
        return { id: this.id, value: this.value }
      }).toArray().map(e => { return item[e.id].eq(e.value) })
      let query = inputs.length > 0 ? db.select().from(item).where(lf.op.and(...inputs)) : db.select().from(item)

      let rows = await query.exec()
      rows.forEach(row => {
        row._identifiers = Object.keys(row).slice(0, keys).map(e => row[e])
        row._columns = Object.keys(row).filter(e => !e.startsWith('_')).slice(1, Object.keys(row).length)
      })

      let rowData = (await gapi.client.sheets.spreadsheets.values.batchGet({
        spreadsheetId: '1BTcZbLAWkyx6Mj9lLY-qscTUP0STs8epPz1zKgGs7fk',
        ranges: [`'${value}'`]
      })).result.valueRanges[0].values.filter(r => rows.some(e => e._identifiers.join('_') === r.slice(0, keys).join('_')))

      /* var serialized = $('#asistencia input').map(function () {
        return { name: this.name, id: this.id, value: this.value === 'on' ? !!this.checked : this.value }
      }).toArray()

      var infoSerial = {}
      serialized.forEach(row => {
        if (row.name === '') return
        if (row.name.includes('_reason')) {
          let id = row.name.split('_').slice(0, -1).join('_')
          if (!rows.some(r => r._identifiers.join('_') === id)) return
          if (!infoSerial[id]) infoSerial[id] = {}
          infoSerial[id].reason = row.value
        } else {
          let id = row.name
          if (!rows.some(r => r._identifiers.join('_') === id)) return
          if (!infoSerial[id]) infoSerial[id] = {}
          infoSerial[id].asistencia = row.value
        }
      })
      console.log(infoSerial) */

      ReactDOM.render(
        Table(rowData),
        document.getElementById('root')
      )
    })
  })
}

function Filter (props) {
  return <React.Fragment>
    <label key={UUID.generate()} htmlFor='_fecha' className='col-sm-1 col-form-label'>Fecha:</label>
    <div key={UUID.generate()} className='col-sm-3'>
      <input key={UUID.generate()} type='date' className='form-control inputChange' id='_fecha' max={new Date().toISOString().split('T')[0]} />
    </div>
    {
      Object.keys(props).map(columnId => {
        return <React.Fragment>
          <label key={UUID.generate()} htmlFor={columnId} className='col-sm-1 col-form-label'>{props[columnId]}</label>
          <div key={UUID.generate()} className='col-sm-3'>
            <input key={UUID.generate()} type='text' className='form-control inputChange' id={columnId} />
          </div>
        </React.Fragment>
      })
    }
  </React.Fragment>
}

function Table (props) {
  return props.map(row => {
    return <React.Fragment>
      <div className='custom-control custom-checkbox col-md-1'>
        {row[keys] === 'Presente' ? (
          <input type='checkbox' className='custom-control-input' name={row.slice(0, keys).join('_')} id={row.slice(0, keys).join('_')} onChange={handleCheck} defaultChecked />
        ) : (
          <input type='checkbox' className='custom-control-input' name={row.slice(0, keys).join('_')} id={row.slice(0, keys).join('_')} onChange={handleCheck} />
        )}
        <label className='custom-control-label' htmlFor={row.slice(0, keys).join('_')}>{row.slice(0, keys).join(' / ')}</label>
      </div>
      {row[keys] === 'Presente' ? (
        <input type='text' className='form-control col-md-2' name={row.slice(0, keys).join('_') + '_reason'} id={row.slice(0, keys).join('_') + '_reason'} disabled />
      ) : (
        <input type='text' className='form-control col-md-2' name={row.slice(0, keys).join('_') + '_reason'} id={row.slice(0, keys).join('_') + '_reason'} defaultValue={row[keys + 1] ? row[keys + 1] : ''} />
      )}
      <div className='col-md-1' />
    </React.Fragment>
  })
}

function handleCheck (ev) {
  ev.persist()
  if (!ev.target.checked) $(`#${ev.target.id}_reason`).removeAttr('disabled')
  else {
    $(`#${ev.target.id}_reason`).prop('disabled', true)
    $(`#${ev.target.id}_reason`).val('')
  }
}

$('#asistencia').submit(async function (event) {
  event.preventDefault()
  var serialized = $('#asistencia input').map(function () {
    return { name: this.name, id: this.id, value: this.value === 'on' ? !!this.checked : this.value }
  }).toArray()

  let inputs = $('.inputChange').filter(function () { return this.value !== '' && this.id !== '_fecha' }).map(function () {
    return { id: this.id, value: this.value }
  }).toArray().map(e => { return item[e.id].eq(e.value) })
  let query = inputs.length > 0 ? db.select().from(item).where(lf.op.and(...inputs)) : db.select().from(item)

  let rows = await query.exec()
  rows.forEach(row => {
    row._identifiers = Object.keys(row).slice(0, keys).map(e => row[e])
    row._columns = Object.keys(row).filter(e => !e.startsWith('_')).slice(1, Object.keys(row).length)
  })

  let rowData = (await gapi.client.sheets.spreadsheets.values.batchGet({
    spreadsheetId: '1BTcZbLAWkyx6Mj9lLY-qscTUP0STs8epPz1zKgGs7fk',
    ranges: [`'${$('#_fecha')[0].value}'`]
  })).result.valueRanges[0].values
  rowData.forEach((r, i) => {
    r.range = i
    if (!r[keys + 1]) r[keys + 1] = ''
  })
  rowData = rowData.filter(r => rows.some(e => e._identifiers.join('_') === r.slice(0, keys).join('_')))

  var infoSerial = {}

  serialized.forEach(row => {
    if (row.name === '') return
    if (row.name.includes('_reason')) {
      let id = row.name.split('_').slice(0, -1).join('_')
      if (!rows.some(r => r._identifiers.join('_') === id)) return
      if (!infoSerial[id]) infoSerial[id] = {}
      infoSerial[id].reason = row.value
    } else {
      let id = row.name
      if (!rows.some(r => r._identifiers.join('_') === id)) return
      if (!infoSerial[id]) infoSerial[id] = {}
      infoSerial[id].asistencia = row.value
    }
  })

  let rowsOut = []

  Object.keys(infoSerial).forEach(key => {
    let infoNew = infoSerial[key]
    let infoOld = rowData.filter(e => e.slice(0, keys).join('_') === key)[0]
    if ((infoNew.asistencia !== (infoOld[keys] === 'Presente')) || infoNew.reason !== infoOld[keys + 1]) {
      let row = [...key.split('_').slice(0, keys)]
      row.push(...[infoNew.asistencia ? 'Presente' : 'Ausente', infoNew.reason, infoOld.range])
      rowsOut.push(row)
    }
  })

  Promise.all(rowsOut.map(row => {
    var rangeRow = row.splice(row.length - 1)[0] + 1
    var rangeRowEnd = String.fromCharCode(97 + row.length - 1).toUpperCase()

    return gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: '1BTcZbLAWkyx6Mj9lLY-qscTUP0STs8epPz1zKgGs7fk',
      range: `'${$('#_fecha')[0].value}'!A${rangeRow}:${rangeRowEnd}${rangeRow}`,
      valueInputOption: 'USER_ENTERED',
      values: [ row ]
    })
  })).then(function (response) {
    toastr.success('Registros Actualizados!')
  }).catch(err => {
    console.log(err)
    toastr.error('Error al actualizar registros')
  })
})

gapi.load('client:auth2', start)
