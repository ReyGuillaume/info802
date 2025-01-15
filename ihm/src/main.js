import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const apiUrl = 'http://localhost:3000';

const button = document.getElementById('button');
const depart = document.getElementById('depart');
const arrivee = document.getElementById('arrivee');
const autonomie = document.getElementById('autonomie');
const list = document.querySelector('.vehicule-list');

const map = L.map('map').setView([45.5662672, 5.9203636], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '',
}).addTo(map);

button.addEventListener('click', async () => {
  if (depart.value === '' || arrivee.value === '' || autonomie.value === '') {
    return;
  }

  const coordonneeDepart = await fetchCoordinate(depart.value);
  const coordonneeArrivee = await fetchCoordinate(arrivee.value);
  const autonomieVehicule = parseInt(autonomie.value, 10);

  const points = await pointsIntermediaires(coordonneeDepart, coordonneeArrivee, autonomieVehicule);
  const pointList = [coordonneeDepart, ...points, coordonneeArrivee];

  console.log(pointList)

  try {
    const request = await fetch(`${apiUrl}/obtenirItineraire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({pointList}),
    });
    const data = await request.json();
    
    displayItineraire(data);
    displayPoints(pointList);
  } catch(error){
    alert("Erreur lors de la récupération de l'itinéraire:", error);
  }
});

async function pointsIntermediaires(depart, arrivee, autonomie) {
  const request = await fetch(`${apiUrl}/pointsIntermediaires`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({depart, arrivee, autonomie }),
  });
  return await request.json();
}

function displayPoints(points) {
  points.forEach(p => {
    L.marker([p.lat, p.lon]).addTo(map);
  })
}

function displayItineraire(coord) {
  L.polyline(coord, { color: 'blue', weight: 5, opacity: 0.7 }).addTo(map);
  map.fitBounds(coord);
}

async function fetchCoordinate(address) {
  const request = await fetch(`${apiUrl}/obtenirCoordonnees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({address}),
  });
  const result = await request.json();
  return result;
}

const data = {
  distance: 500,
  autonomie: 200,
  chargement: 30,
};

fetch(`${apiUrl}/calculTempsTrajet`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})
  .then((res) => res.json())
  .then((res) => {
    console.log(res);
  });

fetch(`${apiUrl}/obtenirVehicules`, {
  headers: { 'Content-Type': 'application/json' },
})
  .then((res) => res.json())
  .then(({vehicleList}) => {
    displayVehicules(vehicleList);
  });

function displayVehicules(vehicleList) {
  vehicleList.forEach(vehicle => {
    const elt = document.createElement('div');

    const title = document.createElement('h3');
    title.textContent = vehicle.naming.make;
    elt.appendChild(title)

    const subtitle = document.createElement('p');
    subtitle.textContent = vehicle.naming.model;
    elt.appendChild(subtitle)

    const image = document.createElement('img');
    image.src = vehicle.media.image.thumbnail_url;
    elt.appendChild(image)

    list.appendChild(elt)
  });
}