import './style.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import {Vector as VectorLayer} from 'ol/layer';
import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import {ZoomSlider} from 'ol/control';
import LayerSwitcher from 'ol-layerswitcher';
import Overlay from 'ol/Overlay';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
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
});

// Define a style function for population density
const populationDensityStyle = (feature) => {
  const density = feature.get('Popa_dens_2024'); // Adjust this key if it's named differently in your GeoJSON file
  
  // Define fill colors based on density ranges
  let fillColor = '#ffffb2';  // Default color for 29-200
  if (density > 3000){
    fillColor = '#bd0026'
  } else if (density > 600) {
    fillColor = '#ce4049';
  } else if (density > 400) {
    fillColor = '#de806c';
  } else if (density > 200) {
    fillColor = '#efbf8f';
  } else if (density > 29) {
    fillColor = '#ffffb2';
  }

  return new Style({
    fill: new Fill({
      color: fillColor,
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0)',  // No stroke
      width: 0,
    }),
  });
};

// Create the vector layer with the dynamic style function
const vector = new VectorLayer({
  title: 'Population Density',
  visible: true,
  source: new VectorSource({
    url: 'data/Population_uganda.geojson',
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
  layers: [osmlayer,googleLayer, vector,district],
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
    console.log(feature)
    const coordinate = evt.coordinate;
    overlay.setPosition(coordinate);
  }
});
