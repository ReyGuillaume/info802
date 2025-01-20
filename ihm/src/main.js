import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const apiUrl = 'http://localhost:3000';

const button = document.getElementById('button');
const depart = document.getElementById('depart');
const arrivee = document.getElementById('arrivee');
const list = document.querySelector('.vehicule-list');
const resume = document.querySelector('.resume');

let markers = [];
let itineraires = [];
let vehicleSelected;

const map = L.map('map').setView([45.5662672, 5.9203636], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '',
}).addTo(map);

button.addEventListener('click', async () => {
  if (depart.value === '' || arrivee.value === '' || !vehicleSelected) {
    alert("Renseigner un départ, une arrivée et sélectionner un véhicule.")
    return;
  }
  resume.innerHTML = '';
  const loading = document.createElement('p');
  loading.textContent = 'Loading';
  resume.appendChild(loading)

  const coordonneeDepart = await fetchCoordinate(depart.value);
  const coordonneeArrivee = await fetchCoordinate(arrivee.value);
  const autonomieVehicule = vehicleSelected.range.chargetrip_range.best;

  calculTempsTrajet(coordonneeDepart, coordonneeArrivee, vehicleSelected.range.chargetrip_range.best, vehicleSelected.connectors[0].time);

  const points = await pointsIntermediaires(coordonneeDepart, coordonneeArrivee, autonomieVehicule);
  const pointList = [coordonneeDepart, ...points, coordonneeArrivee];

  try {
    const request = await fetch(`${apiUrl}/obtenirItineraire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({pointList}),
    });
    const data = await request.json();
    
    clearMap();
    displayItineraire(data);
    displayPoints(pointList);
  } catch(error){
    console.log(error)
    alert("Erreur lors de la récupération de l'itinéraire:");
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
    const marker = L.marker([p.lat, p.lon]).addTo(map);
    markers.push(marker);
  })
}

function displayItineraire(coord) {
  const itineraire = L.polyline(coord, { color: 'blue', weight: 5, opacity: 0.7 }).addTo(map);
  map.fitBounds(coord);
  itineraires.push(itineraire);
}

function clearMap() {
  itineraires.forEach(i => {
    i.remove();
  });
  markers.forEach(m => {
    m.remove();
  });
  itineraires = []
  markers = []
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
    elt.addEventListener('click', () => {
      vehicleSelected = vehicle
      document.querySelectorAll(".vehicule-list > div").forEach(div => div.classList.remove("selected"))
      elt.classList.add("selected")
    })

    const title = document.createElement('h3');
    title.textContent = vehicle.naming.make;
    elt.appendChild(title)

    const subtitle = document.createElement('p');
    subtitle.textContent = vehicle.naming.model;
    elt.appendChild(subtitle)

    const autonomie = document.createElement('p');
    autonomie.textContent = "Autonmie : " + vehicle.range.chargetrip_range.best + "km";
    elt.appendChild(autonomie)

    const recharge = document.createElement('p');
    recharge.textContent = "Temps recharge : " + vehicle.connectors[0].time + "min";
    elt.appendChild(recharge)

    const image = document.createElement('img');
    image.src = vehicle.media.image.thumbnail_url;
    elt.appendChild(image)

    list.appendChild(elt)
  });
}

async function calculTempsTrajet(depart, arrivee, autonomie, chargement) {
  const data = { depart, arrivee, autonomie, chargement };
  const request = await fetch(`${apiUrl}/calculTempsTrajet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const res = await request.json();

  resume.innerHTML = '';

  const title = document.createElement('h3');
  title.textContent = 'Résumé';
  resume.appendChild(title)

  const auto = document.createElement('p');
  auto.textContent = 'Autonomie: ' + autonomie + 'km';
  resume.appendChild(auto)

  const charg = document.createElement('p');
  charg.textContent = 'Vitesse chargement: ' + chargement + 'km';
  resume.appendChild(charg)

  return res.calculTempsTrajetResult.integer[0];
}