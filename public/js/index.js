/* global gapi,lf, ReactDOM, $, React, UUID, handleSheets, startFlag, db, item, keys, columns, start */
/* eslint-disable no-global-assign, no-native-reassign */

updateSignInStatus = function (isSignedIn) { 
  if (isSignedIn) loadSheetsRegistro()
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
  db.select().from(item).exec().then(function (rows) {
    rows.forEach(row => {
      row._identifiers = Object.keys(row).slice(0, keys).map(e => row[e])
      row._columns = Object.keys(row).filter(e => !e.startsWith('_')).slice(1, Object.keys(row).length)
    })
    console.log(rows)

    ReactDOM.render(
      Table(rows),
      document.getElementById('root')
    )

    ReactDOM.render(
      Filter(columns),
      document.getElementById('filter')
    )

    $('.inputChange').change(function (ev) {
      let inputs = $('.inputChange').filter(function () { return this.value !== '' }).map(function () {
        return { id: this.id, value: this.value }
      }).toArray().map(e => { return item[e.id].eq(e.value) })

      let query = inputs.length > 0 ? db.select().from(item).where(lf.op.and(...inputs)) : db.select().from(item)

      query.exec().then(function (rows) {
        ReactDOM.render(
          Table(rows),
          document.getElementById('root')
        )
      })
    })
  })
}

function Filter (props) {
  return Object.keys(props).map(columnId => {
    return <React.Fragment>
      <label key={UUID.generate()} htmlFor={columnId} className='col-sm-1 col-form-label'>{props[columnId]}</label>
      <div key={UUID.generate()} className='col-sm-3'>
        <input key={UUID.generate()} type='text' className='form-control inputChange' id={columnId} />
      </div>
    </React.Fragment>
  })
}

function Table (props) {
  return <div id='accordion'>
    {
      props.map(row => {
        return <div className='card'>
          <div className='card-header' id={'heading_' + row._identifiers.join('_')}>
            <h5 className='mb-0'>
              <button className='btn btn-link' data-toggle='collapse' data-target={'#collapse_' + row._identifiers.join('_')} aria-expanded='true' aria-controls={'collapse_' + row._identifiers.join('_')}>
                {row._identifiers.join(' / ')}
              </button>
            </h5>
          </div>

          <div id={'collapse_' + row._identifiers.join('_')} className='collapse show' aria-labelledby={'heading_' + row._identifiers.join('_')} data-parent='#accordion'>
            <div className='card-body'>
              <form>
                <div className='form-group form-row'>
                  {row._columns.map(column => {
                    // return <div key={UUID.generate()} className='col-sm-3'>{row[column]}</div>

                    return <React.Fragment>
                      <label key={UUID.generate()} htmlFor={row._identifiers.join('_') + '_column'} className='col-sm-1 col-form-label'>{columns[column]}:</label>
                      <div key={UUID.generate()} className='col-sm-3'>
                        <input key={UUID.generate()} type='text' readOnly className='form-control-plaintext' id={row._identifiers.join('_') + '_column'} value={row[column]} />
                      </div>
                    </React.Fragment>
                  })}

                </div>
              </form>
            </div>
          </div>
        </div>
      })
    }
  </div>
}

gapi.load('client:auth2', start)
