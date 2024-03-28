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

let cycle;

// Fetch housing data and add it to the map
fetch('https://tor.publicbikesystem.net/ube/gbfs/v1/en/station_information')
  .then(response => response.json())
  .then(response => {
    cycle = response;
  });

map.on('load', () => {
  // Add housing data as a GeoJSON source
  map.addSource('housing', {
    type: 'geojson',
    data: 'https://raw.githubusercontent.com/mikavyas/isochrone_test/main/Affordable-housing.geojson'
  });

  // Add housing data as a layer
  map.addLayer({
    id: 'houses',
    type: 'circle',
    source: 'housing',
    paint: {
      'circle-color': '#600094',
      'circle-opacity': 1.0,
      'circle-radius': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        11,
        4
      ],
      'circle-outline': '#002aff'
    }
  });

  // Event listener for mousemove on houses layer
  let parksize = null;
  map.on('mousemove', 'houses', (e) => {
    if (e.features.length > 0) {
      if (parksize !== null) {
        map.setFeatureState(
          { source: 'housing', id: parksize },
          { hover: false }
        );
      }
      parksize = e.features[0].id;
      map.setFeatureState(
        { source: 'housing', id: parksize },
        { hover: true }
      );
    }
  });

  // Event listener for mouseleave on houses layer
  map.on('mouseleave', 'houses', () => {
    if (parksize !== null) {
      map.setFeatureState(
        { source: 'housing', id: parksize },
        { hover: false }
      );
    }
    parksize = null;
  });

  // Event listener for click on houses layer
  map.on('click', 'houses', (e) => {
    const coordinates1 = e.lngLat;
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML("<b>Address: </b>" + e.features[0].properties.Address + "<br>" +
        "<b>Number of Units proposed:</b> " + e.features[0].properties.Most_recent_number_of_affordab + "<br>" +
        "<b>Number of Units built:</b> " + e.features[0].properties.Units_Built_Num + "<br>" +
        "<b>Construction start date:</b> " + e.features[0].properties.Construction_Start_Date + "<br>" +
        "<b>Construction completion date:</b> " + e.features[0].properties.Actual_Construction_Completion + "<br>" + "<br>" +
        '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp<button class="btn btn-primary btn-sm" id="zoom-in">Zoom to Feature')
      .addTo(map);
    document.getElementById('zoom-in').addEventListener('click', () => {
      map.flyTo({
        center: coordinates1,
        zoom: 13,
        essential: true
      });
    });
  });

  // Event listener for change on affordable housing checkbox
  document.getElementById('affordable-housing-id').addEventListener('change', (e) => {
    map.setLayoutProperty(
      'houses',
      'visibility',
      e.target.checked ? 'visible' : 'none'
    );
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
  fetchIsochroneData();
});
