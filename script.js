mapboxgl.accessToken = 'pk.eyJ1IjoibWlrYXZ5YXMiLCJhIjoiY2xoczhjcDR1MGZqMzNjcW1scm1paTRpNyJ9.yYDAti9jKKB23RGPg8SeRA';

const map = new mapboxgl.Map({
  container: 'my-map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-79.39390704282365, 43.70777081498133],
  zoom: 9.8
});

// Zoom controls
map.addControl(new mapboxgl.NavigationControl(), 'top-left');

// Full screen control
map.addControl(new mapboxgl.FullscreenControl(), 'top-left');

// Event listener for reset button
document.getElementById('reset-button').addEventListener('click', () => {
  map.flyTo({
    center: [-79.39390704282365, 43.70777081498133],
    zoom: 9.8,
    essential: true
  });
});

// Fetch housing data and add it to the map
fetch('https://raw.githubusercontent.com/mikavyas/ido_redo-/main/Affordable-housing.geojson')
  .then(response => response.json())
  .then(housingData => {
    // Add housing data as a GeoJSON source
    map.addSource('housing', {
      type: 'geojson',
      data: housingData
    });

    // Add housing data as a layer
    map.addLayer({
      id: 'houses',
      type: 'circle',
      source: 'housing',
      paint: {
        'circle-color': '#600094',
        'circle-opacity': 1.0,
        'circle-radius': 6,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Event listener for change on affordable housing checkbox
    document.getElementById('affordable-housing-id').addEventListener('change', (e) => {
      map.setLayoutProperty(
        'houses',
        'visibility',
        e.target.checked ? 'visible' : 'none'
      );
    });

    // Fetch isochrone data for each housing point and add to the map
    housingData.features.forEach(point => {
      const coordinates = point.geometry.coordinates;
      fetchIsochroneData(coordinates);
    });
  })
  .catch(error => {
    console.error('Error fetching housing data:', error);
  });

// Function to fetch Isochrone data for a given point
function fetchIsochroneData(coordinates) {
  // Define the URL for the Isochrone API request
  const apiUrl = 'https://api.mapbox.com/isochrone/v1/mapbox/walking/';

  // Define the parameters for the Isochrone API request
  const params = {
    contours_minutes: [5, 10, 15], // Contour intervals in minutes
    polygons: true, // Include polygons in the response
    access_token: mapboxgl.accessToken // Access token for Mapbox API
  };

  // Construct the URL with parameters
  const url = `${apiUrl}${coordinates[0]},${coordinates[1]}.json?${new URLSearchParams(params)}`;

  // Make the request to the Isochrone API
  fetch(url)
    .then(response => response.json())
    .then(data => {
      // Add Isochrone data to the map as a GeoJSON source and layer
      map.addSource(`isochrone-${coordinates.join('-')}`, {
        type: 'geojson',
        data: data
      });

      // Add Isochrone layer to the map
      map.addLayer({
        id: `isochrone-layer-${coordinates.join('-')}`,
        type: 'fill',
        source: `isochrone-${coordinates.join('-')}`,
        paint: {
          'fill-color': {
            property: 'contour',
            stops: [
              [5, '#fca90e'], // Color for 5-minute contour
              [10, '#ff6f61'], // Color for 10-minute contour
              [15, '#a34d91'] // Color for 15-minute contour
            ]
          },
          'fill-opacity': 0.3 // Adjust opacity as needed
        }
      });
    })
    .catch(error => {
      console.error('Error fetching Isochrone data:', error);
    });
}
