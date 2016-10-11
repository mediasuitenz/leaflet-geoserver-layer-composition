function asyncXML (url) {
  var xhttp = new XMLHttpRequest()
  return new Promise((resolve, reject) => {
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) resolve(this)
        else reject(this)
      }
    }
    xhttp.open("GET", url, true);
    xhttp.send()
  })
}
    
function getLayers () {
  return document.getElementById('layer-input').value
}

function noOp () {}

const loaded = new Promise((resolve, reject) => window.addEventListener('load', event => resolve(event)))

const makeSelectOption = ({name, title}) => {
  let option = document.createElement('option')
  option.value = name 
  option.innerHTML = title
  return option
}

loaded
.then(_ => asyncXML('/geoserver/wms?service=wms&request=GetCapabilities&version=1.3.0'))
.then(result => {
  const layers = result.responseXML.querySelectorAll("Layer[queryable=\"1\"]")
  let model = []
  layers.forEach(node => {
    model.push({
      title: node.querySelector('Title').innerHTML,
      name: node.querySelector('Name').innerHTML
    })
  })
  return model 
}).then(optionModels => {
  // set all options from our loaded geoserver layers
  const layerSelection = document.getElementById("layers-selection")
  optionModels
    .map(makeSelectOption)
    .forEach(option => layerSelection.appendChild(option))
  layerSelection.setAttribute('size', optionModels.length)

  layerSelection.addEventListener('change', e => {
    // get just selected nodes
    let selected = []
    e.srcElement.childNodes.forEach(n => n.selected ? selected.push(n.value): noOp())
    document.getElementById('layer-input').value = selected.join(',')
  })
  
  const loadButton = document.getElementById("loadButton")

  const tileLayer = L.tileLayer.wms('http://localhost:3000/geoserver/wms', {
    layers: getLayers(),
    format: 'image/png',
    attribution: 'Sourced from LINZ. CC-BY 3.0'
  })

  const map = L.map('my-map', {
    center: L.latLng(36.85, 174.76),
    zoom: 10,
    continuousWorld: true,
    worldCopyJump: false,
  })
  map.setView(L.latLng(-36.85, 174.76), 10)
  map.on('click', e => {
    console.log('dat click in', e)
  })
  map.addLayer(tileLayer)

  loadButton.addEventListener('click', e => {
    console.log('clicked load button')
    tileLayer.setParams({layers: getLayers()})
  })
})