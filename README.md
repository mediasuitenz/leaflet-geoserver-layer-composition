Example code, created for testing out WMS/WFS services

What you can do:
- See published layers from the WMS/WFS service.
- Choose some combination of WMS/WFS layers to render on a map


This is really hacky, it makes a few assumptions 
- The data you want to look at is in auckland (initally we set viewport to auckland lat/lng and set zoomlevel to show just the city)
- You are running the app on port 3000
- You are running a geoserver instance at localhost:8080/geoserver
- It assumes you have a default workspace setup on your geoserver instance, the service should be accessible at `localhost:8080/geoserver/wms`
- leaflet is not doing any reprojection of layers, so make sure published layers are using WGS:84 or Google mercator

# Getting started

```
npm install
node index.js
```

