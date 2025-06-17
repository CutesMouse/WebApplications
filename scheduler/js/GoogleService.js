function initAutocomplete() {
    const input = document.getElementById('edit-destination');
    autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.addListener('place_changed', () => {
        processInput(autocomplete.getPlace());
    });
    input.addEventListener('paste', (e) => {
        setTimeout(processInput, 1);
    })
}

function fetchPlaceFromName(name) {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    return new Promise((resolve, reject) => {
        const request = {
            query: name,
            fields: ['name', 'geometry', 'place_id'],
        };

        service.findPlaceFromQuery(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results[0]) {
                resolve(results[0]);
            } else {
                reject("無法找到該地點");
            }
        });
    });
}


function processInput(place = null) {
    const input = document.getElementById('edit-destination').value.trim();

    const mapPlaceUrlRegex = /\/place\/([^\/]+)\/@([\d\.\-]+),([\d\.\-]+)/;

    const url = document.getElementById('edit-mapUrl');

    // Case 1: 是複雜的 Google Maps /place 連結
    if (input.includes("https://www.google.com/maps/place/") && mapPlaceUrlRegex.test(input)) {
        const match = input.match(mapPlaceUrlRegex);
        const nameEncoded = match[1];
        let name = decodeURIComponent(nameEncoded.replace(/\+/g, ' '));
        setNameValue(name);

        fetchPlaceFromName(name)
            .then((result) => {
                url.value = `https://www.google.com/maps/place/?q=place_id:${result.place_id}`;
            });
    }

    // Case 2: 是乾淨的 Google Maps 連結（https://www.google.com/maps?q=lat,lng）
    else if (input.includes("https://www.google.com/maps") && input.includes("q=")) {
        url.value = input;

        const urlParams = new URL(input);
        const q = urlParams.searchParams.get('q');
        if (q) setNameValue(decodeURIComponent(q));
    }

    // Case 3: 使用自動完成選擇地名
    else if (place) {
        setNameValue(place.name);
        url.value = place.url;
    }
}

function setNameValue(value) {
    const name = document.getElementById('edit-name');
    const icon = document.getElementById('edit-icon');
    const startTime = document.getElementById('edit-startTime');
    const endTime = document.getElementById('edit-endTime');
    name.value = value;
    let sim = findSimilar(value);
    if (sim) {
        icon.value = sim.icon;
        startTime.value = sim.time.split('-')[0];
        endTime.value = sim.time.split('-')[1];
    }
}

function arrange(origin, dest, travelMode, departureTime, handler) {
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
        {
            origins: [origin],
            destinations: [dest],
            travelMode: travelMode,
            transitOptions: {
                departureTime: departureTime
            },
            unitSystem: google.maps.UnitSystem.METRIC,
            language: 'zh-TW',
        },
        (response, status) => {
            if (status !== 'OK') {
                handler({status: "error"});
                return;
            }
            const result = response.rows[0].elements[0];
            if (result.status !== 'OK') {
                handler({status: "error"});
                return;
            }
            const distance = result.distance.text;
            const duration = result.duration.text;
            handler({status: "success", distance: distance, duration: duration});
        }
    );
}

initAutocomplete();