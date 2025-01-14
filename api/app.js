const express = require('express');
const soap = require('soap');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const wsdlUrl = 'http://127.0.0.1:8000/?wsdl';

app.post('/calculTempsTrajet', (req, res) => {
  const args = req.body;

  soap.createClient(wsdlUrl, (_, client) => {
    client.calculTempsTrajet(args, (err, result) => {
      if (err) {
        console.error('Error :', err);
        res.status(500).json({ error: err });
        return;
      }

      res.json(result);
    });
  });
});

app.post('/borneAProximite', (req, res) => {
  const { xlongitude, ylatitude } = req.body;

  if (!xlongitude || !ylatitude) {
    return res.status(400).json({ error: 'Longitude et latitude sont requises.' });
  }

  const url = `https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/bornes-irve/records?` +
    `& order_by = ${encodeURIComponent(`(xlongitude-${xlongitude})*(xlongitude-${xlongitude})+(ylatitude-${ylatitude})*(ylatitude-${ylatitude})`)} ASC` +
    `& limit = 1`;

  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Apikey cf0bd2c44f0034503d6417d6e2124bac0222f83412249d2eb9987fe5',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      console.error('Error :', error);
      res.status(500).json({ error: error.message });
    });
});

app.post('/obtenirCoordonnees', (req, res) => {
  const { address } = req.body;

  fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json`)
    .then((response) => response.json())
    .then((data) => {
      if (data.length > 0) {
        res.json(data[0]);
      } else {
        return res.status(400).json({ error: 'Aucun resultat trouvé.' });
      }
    })
    .catch((error) => {
      console.error('Error :', error);
      res.status(500).json({ error });
    });
});

app.post('/obtenirItineraire', async (req, res) => {
  const { pointList } = req.body;

  if (pointList.length < 2) {
    return res.status(400).json({ error: 'L\'itineraire doit contenir au moins un départ et une arrivée' });
  }

  const route = [];

  for (let i = 0; i < pointList.length - 1; i++) {
    const point1 = pointList[i];
    const point2 = pointList[i+1];

    const request = await fetch(`http://router.project-osrm.org/route/v1/driving/${point1.lon},${point1.lat};${point2.lon},${point2.lat}?overview=full&geometries=geojson`)
    const result = await request.json()
    
    const coordinates = result.routes[0].geometry.coordinates;
    coordinates.map(coord => route.push([coord[1], coord[0]]));
  }

  res.json(route);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
