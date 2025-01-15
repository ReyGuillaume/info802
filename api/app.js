const express = require('express');
const soap = require('soap');
const cors = require('cors');
const geolib = require('geolib');

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

app.post('/borneAProximite', async (req, res) => {
  const { xlongitude, ylatitude } = req.body;

  if (!xlongitude || !ylatitude) {
    return res.status(400).json({ error: 'Longitude et latitude sont requises.' });
  }

  try {
    const data = await borneAProximite(xlongitude, ylatitude);
    return res.json(data);
  } catch (error) {
    console.error('Error :', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/obtenirCoordonnees', async (req, res) => {
  const { address } = req.body;

  try {
    const request = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json`);
    const data = await request.json();
    
    if (data.length > 0) {
      res.json(data[0]);
    } else {
      return res.status(400).json({ error: 'Aucun resultat trouvé.' });
    }
  } catch(error) {
    console.error('Error :', error);
    return res.status(500).json({ error });
  }
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

    const coordinates = await getRouteCoordinates(point1, point2);
    coordinates.map(coord => route.push([coord[1], coord[0]]));
  }

  res.json(route);
});

app.post('/pointsIntermediaires', async (req, res) => {
  const { depart, arrivee, autonomie } = req.body;
  const distanceIntermediaire = autonomie * 1000;

  const distanceTotale = geolib.getDistance(
    { latitude: depart.lat, longitude: depart.lon },
    { latitude: arrivee.lat, longitude: arrivee.lon }
  );

  const nbPoints = Math.floor(distanceTotale / distanceIntermediaire);
  const points = [];

  for (let i = 1; i <= nbPoints; i++) {
    const fraction = i / (nbPoints + 1);
    const point = geolib.computeDestinationPoint(
      { latitude: depart.lat, longitude: depart.lon },
      fraction * distanceTotale,
      geolib.getRhumbLineBearing(
      { latitude: depart.lat, longitude: depart.lon },
      { latitude: arrivee.lat, longitude: arrivee.lon }
      )
    );
    const borne = await borneAProximite(point.longitude, point.latitude);
    points.push(borne.geo_point_borne);
  }

  res.json(points);
});

const query = `
  query vehicleList {
    vehicleList {
      id
      naming {
        make
        model
        chargetrip_version
      }
      media {
        image {
          thumbnail_url
        }
      }
    }
  }
`;

app.get('/obtenirVehicules', async (_req, res) => {
  try {
    const request = await fetch('https://api.chargetrip.io/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': '6787a2614dd456c02066c24c',
        'x-app-id': '6787a2614dd456c02066c24e',
      },
      body: JSON.stringify({ query }),
    });
    const result = await request.json();
    return res.json(result.data);
  } catch(error) {
    console.error('Error :', error);
    return res.status(500).json({ error });
  }
});

async function getRouteCoordinates(point1, point2) {
  const request = await fetch(`http://router.project-osrm.org/route/v1/driving/${point1.lon},${point1.lat};${point2.lon},${point2.lat}?overview=full&geometries=geojson`);
  const result = await request.json();
  
  return result.routes[0].geometry.coordinates;
}

async function borneAProximite(lon, lat) {
  const url = `https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/bornes-irve/records?` +
    `order_by=${encodeURIComponent(`(xlongitude-${lon})*(xlongitude-${lon})+(ylatitude-${lat})*(ylatitude-${lat})`)}&limit=1`;
  
  const request = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Apikey cf0bd2c44f0034503d6417d6e2124bac0222f83412249d2eb9987fe5',
    },
  });
  const data = await request.json();
  return data.results[0];
}

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
