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
        res.status(500).send(err);
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
    `where = xlongitude >= ${encodeURIComponent(xlongitude - 0.2)} AND xlongitude <= ${encodeURIComponent(xlongitude + 0.2)} ` +
    `AND ylatitude >= ${encodeURIComponent(ylatitude - 0.2)} AND ylatitude <= ${encodeURIComponent(ylatitude + 0.2)}` +
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
      res.status(500).json({ error: 'Erreur lors de la récupération des données.', details: error.message });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
