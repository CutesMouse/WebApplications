// --- Google Maps Functions ---
let mapLoaded = false;
let mapInstance = null;
let geocoder = null;
let infoWindow = null;
let currentMapDate = null;
let currentMarkers = []; // NEW: To keep track of markers on the map
let oms = null; // NEW: OverlappingMarkerSpiderfier instance
let currentPolyline = null; // NEW: To hold the connecting line

function loadGoogleMapsApi() {
    if (mapLoaded) {
        processMapRequest();
        return;
    }
    mapLoaded = true;
    geocoder = new google.maps.Geocoder();
    infoWindow = new google.maps.InfoWindow({
        pixelOffset: new google.maps.Size(0, -10),
    });

    const mapContainer = document.getElementById('map-container');
    mapInstance = new google.maps.Map(mapContainer, {
        center: {lat: 23.973875, lng: 120.982025},
        zoom: 8,
        gestureHandling: "greedy",
        mapTypeControl: false,
        streetViewControl: false,
        mapId: "DEMO-MAP"
    });

    // NEW: Initialize OverlappingMarkerSpiderfier
    oms = new OverlappingMarkerSpiderfier(mapInstance, {
        markersWontMove: true,
        markersWontHide: true,
        basicFormatEvents: true,
        keepSpiderfied: true
    });

    // NEW: Set a single click listener on OMS
    oms.addListener('click', (marker) => {
        infoWindow.setContent(marker.desc); // Retrieve content from marker
        if (infoWindow.isOpen && infoWindow.marker === marker) infoWindow.close();
        else {
            infoWindow.open(mapInstance, marker);
            infoWindow.marker = marker;
        }
    });

    // Trigger the map processing now that the API is ready
    processMapRequest();
}

function processMapRequest() {
    if (!mapLoaded || !currentMapDate) return;
    renderMapForDate(currentMapDate);
}

async function openMap(dateString) {
    currentMapDate = dateString;
    const modal = document.getElementById('map-modal');
    const title = document.getElementById('map-modal-title');

    const dayData = getSchedule(dateString);

    if (!dayData || !dayData.stops || dayData.stops.length === 0) {
        showNotification('沒有可顯示的行程！');
        return;
    }

    title.textContent = `${formatDate(dateString)}`;
    modal.classList.remove('hidden');

    if (!mapLoaded) {
        loadGoogleMapsApi();
    } else {
        processMapRequest();
    }
}

async function renderMapForDate(dateString) {
    const dayData = getSchedule(dateString);

    infoWindow.close();
    oms.removeAllMarkers();
    currentMarkers = [];
    if (currentPolyline) currentPolyline.setMap(null);

    const geocodePromises = dayData.stops.map(stop => {
        const locationToCode = stop.destination || stop.name;
        return new Promise((resolve) => {
            geocoder.geocode({'address': locationToCode, 'region': 'TW'}, (results, status) => {
                if (status === 'OK') {
                    resolve({stop, location: results[0].geometry.location, status});
                } else {
                    console.warn(`Geocode was not successful for "${locationToCode}" for the following reason: ${status}`);
                    resolve({stop, location: null, status});
                }
            });
        });
    });

    const geocodedResults = await Promise.all(geocodePromises);
    const validStops = geocodedResults.filter(r => r.status === 'OK');
    const notFoundStops = geocodedResults.filter(r => r.status !== 'OK').map(r => r.stop.destination || r.stop.name);

    if (notFoundStops.length > 0) {
        showNotification(`找不到以下景點：${notFoundStops.join('、 ')}`);
    }

    if (validStops.length === 0) {
        showNotification('所有景點都無法定位');
        return;
    }

    // --- Add new custom markers ---
    validStops.forEach(({stop, location}, i) => {
        // MODIFIED: Use standard marker with custom SVG icon
        const svg = createMarkerSvg(stop.image, i + 1);
        const iconUri = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);

        const marker = new google.maps.Marker({
            position: location,
            // Do NOT set map here; OMS will handle it.
            icon: {
                url: iconUri,
                scaledSize: new google.maps.Size(44, 44),
                anchor: new google.maps.Point(22, 44) // Anchor at bottom-center
            },
            zIndex: validStops.length - i // Give later markers higher z-index
        });

        // Create InfoWindow content and attach it to the marker
        const infoWindowContent = `<div class="custom-infowindow-content"><div class="flex items-center mb-2"><span class="text-2xl mr-3">${stop.image}</span><h3 class="font-bold text-lg text-gray-800">${stop.display_text}</h3></div><p class="text-gray-600">${stop.time}</p></div>`;
        marker.desc = infoWindowContent;

        // NEW: Add the marker to OMS instead of the map directly
        oms.addMarker(marker);
        currentMarkers.push(marker); // Keep track for other purposes if needed
    });

    if (validStops.length > 1) {
        const flightPlanCoordinates = validStops.map(r => r.location);
        currentPolyline = new google.maps.Polyline({
            path: flightPlanCoordinates,
            geodesic: true,
            strokeColor: '#3b82f6', // blue-500
            strokeOpacity: 0.8,
            strokeWeight: 3,
        });
        currentPolyline.setMap(mapInstance);

        // Adjust map bounds to show all markers and the line
        const bounds = new google.maps.LatLngBounds();
        validStops.forEach(r => bounds.extend(r.location));
        mapInstance.fitBounds(bounds);
    } else {
        // If only one point, just center the map on it
        mapInstance.setCenter(validStops[0].location);
        mapInstance.setZoom(15);
    }
}

function closeMap() {
    const modal = document.getElementById('map-modal');
    modal.classList.add('hidden');
    currentMapDate = null;
}

// NEW: Function to create custom SVG markers
function createMarkerSvg(icon, number) {
    const markerSize = 44;
    const numberCircleRadius = 10;
    const numberFontSize = 12;
    // Using a simple pin shape as background for better map visibility
    return `
    <svg width="${markerSize}" height="${markerSize}" viewBox="0 0 ${markerSize} ${markerSize}" xmlns="http://www.w3.org/2000/svg">
    <g>
    <circle cx="${markerSize / 2}" cy="${markerSize / 2}" r="${(markerSize / 2) - 2}" fill="white" stroke="#3b82f6" stroke-width="2.5"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="20">${icon}</text>
    <circle cx="${markerSize - numberCircleRadius - 1}" cy="${numberCircleRadius + 1}" r="${numberCircleRadius}" fill="#ef4444" stroke="white" stroke-width="2"/>
    <text x="${markerSize - numberCircleRadius - 1}" y="${numberCircleRadius + 1}" fill="white" dominant-baseline="central" text-anchor="middle" font-size="${numberFontSize}" font-weight="bold">${number}</text>
    </g>
    </svg>
    `;
}