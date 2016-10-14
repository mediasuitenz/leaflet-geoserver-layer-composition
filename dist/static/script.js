function getLayers () {
  return document.getElementById('layer-input').value
}


const loaded = new Promise((resolve, reject) => window.addEventListener('load', event => resolve(event)))

const makeSelectOption = ({name, title}) => {
  let option = document.createElement('option')
  option.value = name 
  option.innerHTML = title
  return option
}
const zoomedOrMoved = (map, cb) => {
  map.on('zoomend', cb)
  map.on('moveend', cb)
}

function setMapViewFromUrl(map, url) {
  const lat = url.searchParams.get('lat') || -36.85
  const lng = url.searchParams.get('lng') || 174.76
  const zoomlevel = url.searchParams.get('z') || 10
  return map.setView(L.latLng(lat, lng), zoomlevel)
}

loaded
.then(_ => xhrGET('/geoserver/wms?service=wms&request=GetCapabilities&version=1.3.0'))
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

  const tileLayer = L.tileLayer.wms('/geoserver/wms', {
    layers: getLayers(),
    format: 'image/png',
    attribution: 'Sourced from LINZ. CC-BY 3.0'
  })

  const map = L.map('my-map', {
    center: L.latLng(-36.85, 174.76),
    zoom: 10,
    continuousWorld: true,
    worldCopyJump: false,
  })

  setMapViewFromUrl(map, new URL(window.location.href))

  zoomedOrMoved(map, e => {
    const location = map.getCenter()
    const zoomlevel = map.getZoom()
    let url = new URL(window.location.href)
    url.searchParams.set('z', zoomlevel)
    url.searchParams.set('lat', location.lat)
    url.searchParams.set('lng', location.lng)
    
    window.history.pushState({path: url.href}, '', url.href);
  })

  map.on('click', e => {
    console.log('dat click in', e)
    query(e.latlng.lat, e.latlng.lng)
      .then(yo => {
        console.log('got data for point', e.latlng, yo)
      })
      .catch(err => {
        console.log('bad request', err)
      })
  })
  map.addLayer(tileLayer)

  loadButton.addEventListener('click', e => {
    tileLayer.setParams({layers: getLayers()})
  })
  
  window.addEventListener('popstate', e => {
    const url = new URL(e.state.path)
    setMapViewFromUrl(map, url)
  })
})

// utillity
function xhr (method, url, body) {
  var xhttp = new XMLHttpRequest()
  return new Promise((resolve, reject) => {
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) resolve(this)
        else reject(this)
      }
    }
    xhttp.open(method, url, true);
    if (method === 'POST') {
      xhttp.setRequestHeader("content-type", "application/xml")
      xhttp.send(body)
    } else {
      xhttp.send()
    }
  })
}
function xhrGET (url) {
  return xhr('GET', url)
}

function xhrPOST (url, body) {
  return xhr('POST', url, body)
}
    
function noOp () {}


function query (lat, lng) {
  var bboxQuery = `
  <wfs:GetFeature
    xmlns:ogc="http://www.opengis.net/ogc"
    xmlns:gml="http://www.opengis.net/gml"
    xmlns:wfs="http://www.opengis.net/wfs"
    service="WFS"
    version="1.1.0"
    maxFeatures="10"
    outputFormat="text/xml; subtype=gml/3.1.1">
    <wfs:Query
      srsName="EPSG:4326" typeName="ersin-map:parcels-reprojected">
      <ogc:Filter>
        <ogc:BBOX>
          <ogc:PropertyName>shape</ogc:PropertyName>
          <gml:Envelope srsName="EPSG:4326">
            <gml:lowerCorner>${lng - 0.05} ${lat - 0.05}</gml:lowerCorner>
            <gml:upperCorner>${lng + 0.05}  ${lat + 0.05}</gml:upperCorner>
          </gml:Envelope>
        </ogc:BBOX>
      </ogc:Filter>
    </wfs:Query>
  </wfs:GetFeature>`
  console.log(bboxQuery)
  return xhrPOST("/geoserver/wfs", bboxQuery)
}