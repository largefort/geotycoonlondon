// Initialize map
var map = L.map('map', {
    zoomControl: false // Disable default zoom control
}).setView([51.509865, -0.118092], 10); // Centered on London

// Base layers
var baseLayers = {
    "Street Map": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
    }),
    "Satellite": L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data © <a href="https://www.opentopomap.org/copyright">OpenStreetMap',
        maxZoom: 18,
    }),
    "EsriWorldImagery": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
    })
};

// Weather layer
var apiKey = 'd84afbbe625f95c7ac07c52f081f1da6';
var weatherLayer = L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`, {
    maxZoom: 18
});

baseLayers["EsriWorldImagery"].addTo(map);
weatherLayer.addTo(map); // Add weather layer to the map

// Initialize World Mini Map
var worldMiniMap = L.control.worldMiniMap({
    position: 'bottomleft',
    style: {
        opacity: 0.9,
        borderRadius: '0px',
        backgroundColor: 'lightblue'
    }
}).addTo(map);

// Game Variables
var money = 1000; // Initial money in £
var energy = 0; // Energy production starts at 0
var ownedLand = [];
var spinningJennies = [];
var steamEngines = [];
var steamboats = [];
var locomotives = [];
var electricEngines = [];
var newBuilding;
var efficiency = 100;
var weather = 'Fetching...';
var weatherImpact = 1.0; // Multiplier for production rate

var totalEnergyGenerated = 0;
var totalBuildingsPlaced = 0;
var totalLandsOwned = 0;
var totalMoneyProduced = 0; // Total money produced in £

var weatherConditions = {
    'thunderstorm': 0.5,
    'drizzle': 0.8,
    'rain': 0.7,
    'snow': 0.6,
    'clear': 1.0,
    'clouds': 0.9,
    'wind': 0.8,
    'overcast': 0.7,
    'red weather alert': 0.3,
    'yellow weather alert': 0.5
};

// Function to format large numbers in a short format (e.g., 1K, 1M)
function shortNumberFormat(num) {
    if (num >= 1e9) {
        return (num / 1e9).toFixed(1) + 'B';
    }
    if (num >= 1e6) {
        return (num / 1e6).toFixed(1) + 'M';
    }
    if (num >= 1e3) {
        return (num / 1e3).toFixed(1) + 'K';
    }
    return num;
}

// Function to format large numbers in watts notation
function wattsFormat(num) {
    if (num >= 1e9) {
        return (num / 1e9).toFixed(1) + ' GW';
    }
    if (num >= 1e6) {
        return (num / 1e6).toFixed(1) + ' MW';
    }
    if (num >= 1e3) {
        return (num / 1e3).toFixed(1) + ' kW';
    }
    return num + ' W';
}

// Function to update money display
function updateMoney() {
    document.getElementById('money').innerText = shortNumberFormat(money);
}

// Function to update energy display
function updateEnergy() {
    document.getElementById('energy').innerText = wattsFormat(energy);
}

// Function to update efficiency display
function updateEfficiency() {
    document.getElementById('efficiency').innerText = efficiency + '%';
}

// Function to update weather display
function updateWeather() {
    document.getElementById('weather').innerText = weather;
}

// Function to update money production display
function updateMoneyProduction() {
    var moneyProduction = 0;
    spinningJennies.forEach(jenny => {
        moneyProduction += jenny.production * weatherImpact; // Revenue from each Jenny
    });
    steamEngines.forEach(engine => {
        moneyProduction += engine.production * weatherImpact; // Revenue from each Steam Engine
    });
    steamboats.forEach(boat => {
        moneyProduction += boat.production * weatherImpact; // Revenue from each Steamboat
    });
    locomotives.forEach(loco => {
        moneyProduction += loco.production * weatherImpact; // Revenue from each Locomotive
    });
    electricEngines.forEach(engine => {
        moneyProduction += engine.production * weatherImpact; // Revenue from each Electric Engine
    });
    document.getElementById('money-production').innerText = shortNumberFormat(moneyProduction.toFixed(2));
}

// Function to update all resource counters
function updateResourceCounters() {
    updateMoney();
    updateEnergy();
    updateEfficiency();
    updateMoneyProduction();
    updateStats();
}

// Popup Functions for DLC Buildings
function showJennyPopUp(amount, latlng) {
    var popUp = document.createElement('div');
    popUp.className = 'jenny-pop-up';
    popUp.style.left = latlng.x + 'px';
    popUp.style.top = latlng.y + 'px';
    popUp.innerText = `+£${shortNumberFormat(amount)} from Spinning Jenny`;
    document.body.appendChild(popUp);

    setTimeout(() => {
        popUp.style.transform = 'translateY(-50px)';
        popUp.style.opacity = 0;
        setTimeout(() => {
            document.body.removeChild(popUp);
        }, 1000);
    }, 1000);
}

function showSteamEnginePopUp(amount, latlng) {
    var popUp = document.createElement('div');
    popUp.className = 'steam-engine-pop-up';
    popUp.style.left = latlng.x + 'px';
    popUp.style.top = latlng.y + 'px';
    popUp.innerText = `+£${shortNumberFormat(amount)} from Steam Engine`;
    document.body.appendChild(popUp);

    setTimeout(() => {
        popUp.style.transform = 'translateY(-50px)';
        popUp.style.opacity = 0;
        setTimeout(() => {
            document.body.removeChild(popUp);
        }, 1000);
    }, 1000);
}

function showSteamboatPopUp(amount, latlng) {
    var popUp = document.createElement('div');
    popUp.className = 'steamboat-pop-up';
    popUp.style.left = latlng.x + 'px';
    popUp.style.top = latlng.y + 'px';
    popUp.innerText = `+£${shortNumberFormat(amount)} from Steamboat`;
    document.body.appendChild(popUp);

    setTimeout(() => {
        popUp.style.transform = 'translateY(-50px)';
        popUp.style.opacity = 0;
        setTimeout(() => {
            document.body.removeChild(popUp);
        }, 1000);
    }, 1000);
}

function showLocomotivePopUp(amount, latlng) {
    var popUp = document.createElement('div');
    popUp.className = 'locomotive-pop-up';
    popUp.style.left = latlng.x + 'px';
    popUp.style.top = latlng.y + 'px';
    popUp.innerText = `+£${shortNumberFormat(amount)} from Locomotive`;
    document.body.appendChild(popUp);

    setTimeout(() => {
        popUp.style.transform = 'translateY(-50px)';
        popUp.style.opacity = 0;
        setTimeout(() => {
            document.body.removeChild(popUp);
        }, 1000);
    }, 1000);
}

function showElectricEnginePopUp(amount, latlng) {
    var popUp = document.createElement('div');
    popUp.className = 'electric-engine-pop-up';
    popUp.style.left = latlng.x + 'px';
    popUp.style.top = latlng.y + 'px';
    popUp.innerText = `+£${shortNumberFormat(amount)} from Electric Engine`;
    document.body.appendChild(popUp);

    setTimeout(() => {
        popUp.style.transform = 'translateY(-50px)';
        popUp.style.opacity = 0;
        setTimeout(() => {
            document.body.removeChild(popUp);
        }, 1000);
    }, 1000);
}

// Function to save game state
function saveGameState() {
    var gameState = {
        money: money,
        energy: energy,
        efficiency: efficiency,
        weather: weather,
        ownedLand: ownedLand.map(marker => marker.getLatLng()),
        spinningJennies: spinningJennies.map(jenny => ({
            latlng: jenny.marker.getLatLng(),
            level: jenny.level,
            production: jenny.production
        })),
        steamEngines: steamEngines.map(engine => ({
            latlng: engine.marker.getLatLng(),
            level: engine.level,
            production: engine.production
        })),
        steamboats: steamboats.map(boat => ({
            latlng: boat.marker.getLatLng(),
            level: boat.level,
            production: boat.production
        })),
        locomotives: locomotives.map(loco => ({
            latlng: loco.marker.getLatLng(),
            level: loco.level,
            production: loco.production
        })),
        electricEngines: electricEngines.map(engine => ({
            latlng: engine.marker.getLatLng(),
            level: engine.level,
            production: engine.production
        })),
        stats: {
            totalEnergyGenerated: totalEnergyGenerated,
            totalBuildingsPlaced: totalBuildingsPlaced,
            totalLandsOwned: totalLandsOwned,
            totalMoneyProduced: totalMoneyProduced
        }
    };
    localStorage.setItem('geoTycoonLondonDLCState', JSON.stringify(gameState));
}

// Function to load game state
function loadGameState() {
    var gameState = JSON.parse(localStorage.getItem('geoTycoonLondonDLCState'));
    if (gameState) {
        money = gameState.money;
        energy = gameState.energy;
        efficiency = gameState.efficiency;
        weather = gameState.weather;

        totalEnergyGenerated = gameState.stats.totalEnergyGenerated || 0;
        totalBuildingsPlaced = gameState.stats.totalBuildingsPlaced || 0;
        totalLandsOwned = gameState.stats.totalLandsOwned || 0;
        totalMoneyProduced = gameState.stats.totalMoneyProduced || 0;

        updateResourceCounters();

        gameState.ownedLand.forEach(latlng => {
            var marker = L.marker(latlng).addTo(map).bindPopup('Owned Land');
            ownedLand.push(marker);
        });

        gameState.spinningJennies.forEach(jennyData => {
            var jenny = L.marker(jennyData.latlng, {
                icon: L.icon({
                    iconUrl: 'spinning_jenny.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                }),
                draggable: true
            }).addTo(map).bindPopup('Spinning Jenny (Level ' + jennyData.level + ')');
            jenny.on('click', function () {
                upgradeBuilding(spinningJennies, jenny, 50); // Upgrade cost is 50
            });
            spinningJennies.push({
                marker: jenny,
                level: jennyData.level,
                production: jennyData.production
            });
        });

        gameState.steamEngines.forEach(engineData => {
            var engine = L.marker(engineData.latlng, {
                icon: L.icon({
                    iconUrl: 'steam_engine.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                }),
                draggable: true
            }).addTo(map).bindPopup('Steam Engine (Level ' + engineData.level + ')');
            engine.on('click', function () {
                upgradeBuilding(steamEngines, engine, 100); // Upgrade cost is 100
            });
            steamEngines.push({
                marker: engine,
                level: engineData.level,
                production: engineData.production
            });
        });

        gameState.steamboats.forEach(boatData => {
            var boat = L.marker(boatData.latlng, {
                icon: L.icon({
                    iconUrl: 'steamboat.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                }),
                draggable: true
            }).addTo(map).bindPopup('Steamboat (Level ' + boatData.level + ')');
            boat.on('click', function () {
                upgradeBuilding(steamboats, boat, 200); // Upgrade cost is 200
            });
            steamboats.push({
                marker: boat,
                level: boatData.level,
                production: boatData.production
            });
        });

        gameState.locomotives.forEach(locoData => {
            var loco = L.marker(locoData.latlng, {
                icon: L.icon({
                    iconUrl: 'locomotive.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                }),
                draggable: true
            }).addTo(map).bindPopup('Locomotive (Level ' + locoData.level + ')');
            loco.on('click', function () {
                upgradeBuilding(locomotives, loco, 300); // Upgrade cost is 300
            });
            locomotives.push({
                marker: loco,
                level: locoData.level,
                production: locoData.production
            });
        });

        gameState.electricEngines.forEach(engineData => {
            var engine = L.marker(engineData.latlng, {
                icon: L.icon({
                    iconUrl: 'electric_engine.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                }),
                draggable: true
            }).addTo(map).bindPopup('Electric Engine (Level ' + engineData.level + ')');
            engine.on('click', function () {
                upgradeBuilding(electricEngines, engine, 400); // Upgrade cost is 400
            });
            electricEngines.push({
                marker: engine,
                level: engineData.level,
                production: engineData.production
            });
        });
    }
}

// Function to generate revenue for all buildings
function generateRevenue() {
    spinningJennies.forEach(jenny => {
        var production = jenny.production * weatherImpact;
        money += production;
        totalMoneyProduced += production;
        var latlng = map.latLngToContainerPoint(jenny.marker.getLatLng());
        showJennyPopUp(production.toFixed(2), latlng); // Show Jenny pop-up
    });

    steamEngines.forEach(engine => {
        var production = engine.production * weatherImpact;
        money += production;
        totalMoneyProduced += production;
        var latlng = map.latLngToContainerPoint(engine.marker.getLatLng());
        showSteamEnginePopUp(production.toFixed(2), latlng); // Show Steam Engine pop-up
    });

    steamboats.forEach(boat => {
        var production = boat.production * weatherImpact;
        money += production;
        totalMoneyProduced += production;
        var latlng = map.latLngToContainerPoint(boat.marker.getLatLng());
        showSteamboatPopUp(production.toFixed(2), latlng); // Show Steamboat pop-up
    });

    locomotives.forEach(loco => {
        var production = loco.production * weatherImpact;
        money += production;
        totalMoneyProduced += production;
        var latlng = map.latLngToContainerPoint(loco.marker.getLatLng());
        showLocomotivePopUp(production.toFixed(2), latlng); // Show Locomotive pop-up
    });

    electricEngines.forEach(engine => {
        var production = engine.production * weatherImpact;
        money += production;
        totalMoneyProduced += production;
        var latlng = map.latLngToContainerPoint(engine.marker.getLatLng());
        showElectricEnginePopUp(production.toFixed(2), latlng); // Show Electric Engine pop-up
    });

    saveGameState();
}

// Function to buy land
function buyLand() {
    if (money >= 100) {
        alert("Tap on the map to buy land.");
        map.once('click', function (e) {
            var latlng = e.latlng;
            var marker = L.marker(latlng).addTo(map).bindPopup('Owned Land');
            ownedLand.push(marker);
            money -= 100;
            totalLandsOwned++; // Track total lands owned
            calculateEfficiency();
            updateResourceCounters();
            saveGameState();
        });
    } else {
        alert("Not enough money!");
    }
}

// Generic function to upgrade buildings
function upgradeBuilding(buildingArray, buildingMarker, upgradeCost) {
    var buildingToUpgrade = buildingArray.find(building => building.marker._leaflet_id === buildingMarker._leaflet_id);
    if (buildingToUpgrade && money >= upgradeCost) {
        buildingToUpgrade.level += 1;
        buildingToUpgrade.production += 5 * buildingToUpgrade.level; // Increment production based on level
        buildingToUpgrade.marker.setPopupContent(buildingToUpgrade.marker.getPopup().getContent().split(' ')[0] + ' (Level ' + buildingToUpgrade.level + ')').openPopup();
        money -= upgradeCost;
        updateResourceCounters();
        saveGameState();
    } else {
        alert("Not enough money to upgrade or no building found!");
    }
}

// Function to update stats
function updateStats() {
    document.getElementById('total-energy').innerText = wattsFormat(totalEnergyGenerated);
    document.getElementById('total-buildings').innerText = totalBuildingsPlaced;
    document.getElementById('total-lands').innerText = totalLandsOwned;
    document.getElementById('total-money-produced').innerText = shortNumberFormat(totalMoneyProduced);

    saveGameState(); // Auto-save stats whenever they are updated
}

// Function to calculate efficiency
function calculateEfficiency() {
    var totalLands = ownedLand.length;
    if (totalLands === 0) {
        efficiency = 100;
        return;
    }

    var lowEfficiencyLands = Math.floor(Math.random() * totalLands);
    efficiency = ((totalLands - lowEfficiencyLands) / totalLands) * 100;
}

// Function to change weather based on API data
async function fetchWeather() {
    var apiKey = '<WGQL3A3FAHHPJD78V4XK987HG>';
    var url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/Iceland?unitGroup=us&key=WGQL3A3FAHHPJD78V4XK987HG&contentType=json`;

    try {
        var response = await fetch(url, {
            method: 'GET',
            headers: {}
        });
        var data = await response.json();
        console.log(data); // Log the response for debugging purposes
        var weatherType = data.currentConditions.conditions.toLowerCase();
        weather = weatherType;
        weatherImpact = weatherConditions[weatherType] || 1.0;
        updateWeather();
        saveGameState();
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

// Load game state on start
loadGameState();

// Generate revenue every 10 seconds
setInterval(generateRevenue, 1000);

// Recalculate efficiency every 30 seconds
setInterval(() => {
    calculateEfficiency();
    updateEfficiency();
}, 30000);

// Fetch weather every 60 seconds
setInterval(() => {
    fetchWeather();
}, 60000);

// Initial fetch weather
fetchWeather();
