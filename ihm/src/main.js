import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const apiUrl = 'http://localhost:3000';

const button = document.getElementById('button');
const depart = document.getElementById('depart');
const arrivee = document.getElementById('arrivee');

const map = L.map('map').setView([45.5662672, 5.9203636], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '',
}).addTo(map);

button.addEventListener('click', async () => {
  const coordonneeDepart = await fetchCoordinate(depart.value);
  const coordonneeArrivee = await fetchCoordinate(arrivee.value);

  const pointList = [coordonneeDepart, coordonneeArrivee];

  fetch(`${apiUrl}/obtenirItineraire`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({pointList}),
  })
    .then((response) => response.json())
    .then((data) => {
      L.polyline(data, { color: 'blue', weight: 5, opacity: 0.7 }).addTo(map);
      map.fitBounds(data);
      pointList.forEach(p => {
        L.marker([p.lat, p.lon]).addTo(map);
      })
    })
    .catch((error) => {
      alert("Erreur lors de la récupération de l'itinéraire:", error);
    });
});

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

fetch(`${apiUrl}/borneAProximite`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ xlongitude: 3.905528, ylatitude: 50.231396 }),
})
  .then((res) => res.json())
  .then((res) => {
    console.log(res);
  });
