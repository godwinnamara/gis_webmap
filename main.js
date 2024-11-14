import './style.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Vector as VectorLayer } from 'ol/layer';
import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import { ZoomSlider } from 'ol/control';
import LayerSwitcher from 'ol-layerswitcher';
import Overlay from 'ol/Overlay';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import { Circle } from 'ol/style';
import { XYZ } from 'ol/source';

/////////////////////declare data source/////////////////////////
const osmlayer = new TileLayer({
  title: 'OSM',
  type: 'base',
  visible: true,
  source: new OSM(),
});

// Google Maps base layer with XYZ source
const googleLayer = new TileLayer({
  title: 'Google Maps',
  type: 'base',
  visible: false,  // Default to hidden
  source: new XYZ({
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',  // URL for Google Satellite tiles
  }),
});

const district = new VectorLayer({
  title: 'District Boundary',
  visible: true,
  source: new VectorSource({
    url: 'data/District.geojson',
    format: new GeoJSON(),
  }),
  style: new Style({
    fill: null,
    stroke:new Stroke({
      color:'#a3b8ba',
      width:2,
    })
  })
});

// Define a style function for population density and growth rate
const populationDensityStyle = (feature) => {
  const density = feature.get('Popa_dens_2024'); // Get the population density

  // Define circle sizes based on population density ranges
  let circleSize = 10; // Default circle size for the lowest range
  if (density > 3000) {
    circleSize = 50;  // Large circle size for very high density
  } else if (density > 600) {
    circleSize = 20;  // Medium-large circle size for high density
  } else if (density > 400) {
    circleSize = 15;  // Medium circle size for moderate density
  } else if (density > 200) {
    circleSize = 10;  // Small-medium circle size for lower density
  } else if (density > 29) {
    circleSize = 5;  // Smallest circle size for lowest density
  }

  // Define colors based on growth rate (you can adjust this logic as needed)
  const growthRate = feature.get('Growth_rate');
  let fillColor = '#ffffb2';  // Default color
  if (growthRate < 0) {
    if (growthRate >= -20) {
      fillColor = '#2b83ba';  // Slightly negative growth rate (light yellow)
    } 
  } else if (growthRate >= 0 && growthRate < 20) {
    fillColor = '#ffffb2'; // Low positive growth rate (light yellow)
  } else if (growthRate >= 20 && growthRate < 40) {
    fillColor = '#590001'; // Moderate positive growth rate (coffe brown)
  } else if (growthRate >= 40 && growthRate < 60) {
    fillColor = '#fd6b19'; // High positive growth rate (orange)
  } else if (growthRate >= 60 && growthRate < 80) {
    fillColor = '#bd0026'; // Very high positive growth rate (red)
  } else if (growthRate >= 80) {
    fillColor = '#800080'; // Extremely high growth rate (purple)
  }
  // Return the style with the circle size and color
  return new Style({
    image: new Circle({
      radius: circleSize,  // Set the radius based on the density ranges
      fill: new Fill({
        color: fillColor,  // Set the color based on growth rate
      }),
      stroke: new Stroke({
        color: 'rgba(0, 0, 0, 0)',  // No stroke
        width: 0,
      }),
    }),
  });
};

// Create the vector layer with the dynamic style function
const vector = new VectorLayer({
  title: 'Population Density',
  visible: true,
  source: new VectorSource({
    url: 'data/Population_uganda_centroid.geojson',
    format: new GeoJSON(),
  }),
  style: populationDensityStyle,  // Apply the dynamic style function
});

/**
 * Elements that make up the popup.
 */
const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

/**
 * Create an overlay to anchor the popup to the map.
 */
const overlay = new Overlay({
  element: container,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

/**
 * Add a click handler to hide the popup.
 * @return {boolean} Don't follow the href.
 */
closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

/////////////////////////////add data source to map//////////////////////////
const map = new Map({
  target: 'map',
  layers: [osmlayer, googleLayer,district,vector],
  view: new View({
    projection: 'EPSG:4326',
    center: [32.1391, 1.453],
    zoom: 7,
  }),
  overlays: [overlay],
});

///////add slider
const zoomslider = new ZoomSlider();
map.addControl(zoomslider);

const layerswitcher = new LayerSwitcher({ tipLabel: 'Legend' });
map.addControl(layerswitcher);

map.on('singleclick', function (evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    if (layer == vector) {
      return feature;
    }
  });

  if (feature) {
    const values = feature.values_;

    let popupContent = '';

    if (values['Name']) {
      popupContent += `<p><strong>Name:</strong> ${values['Name']}</p>`;
    }

    if (values['Total_2014']) {
      popupContent += `<p><strong>Total 2014:</strong> ${values['Total_2014']}</p>`;
    }

    if (values['Total_2024']) {
      popupContent += `<p><strong>Total 2024:</strong> ${values['Total_2024']}</p>`;
    }

    if (values['Growth_rate']) {
      popupContent += `<p><strong>Growth Rate:</strong> ${values['Growth_rate']} %</p>`;
    }

    if (values['Popa_dens_2024']) {
      popupContent += `<p><strong>Population Density 2024:</strong> ${values['Popa_dens_2024']} people/km²</p>`;
    }

    content.innerHTML = popupContent;
    console.log(feature);
    const coordinate = evt.coordinate;
    overlay.setPosition(coordinate);
  }
});
