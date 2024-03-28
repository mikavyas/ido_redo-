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

// Function to fetch Isochrone data
function fetchIsochroneData() {
  // Define the URL for the Isochrone API request
  const apiUrl = 'https://api.mapbox.com/isochrone/v1/mapbox/walking/';

  // Define the coordinates for the center of the isochrone (use the same coordinates as your map center)
  const centerCoords = [-79.39390704282365, 43.70777081498133];

  // Define the parameters for the Isochrone API request
  const params = {
    contours_minutes: [5, 10, 15], // Contour intervals in minutes
    polygons: true, // Include polygons in the response
    access_token: mapboxgl.accessToken // Access token for Mapbox API
  };

  // Construct the URL with parameters
  const url = `${apiUrl}${centerCoords.join(',')}.json?${new URLSearchParams(params)}`;

  // Make the request to the Isochrone API
  fetch(url)
    .then(response => response.json())
    .then(data => {
      // Add Isochrone data to the map as a GeoJSON source and layer
      map.addSource('isochrone', {
        type: 'geojson',
        data: data
      });

      // Add Isochrone layer to the map
      map.addLayer({
        id: 'isochrone-layer',
        type: 'fill',
        source: 'isochrone',
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

// Call the function to fetch Isochrone data when the map loads
map.on('load', () => {
  fetchIsochroneData();
});

