const express = require('express');
const bodyParser = require('body-parser');
const db = require('./models');
const fetch = require('node-fetch');

const app = express();

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

app.use(bodyParser.json());
app.use(express.static(`${__dirname}/static`));


app.get('/api/games', async (req, res) => {
  try {
    const games = await db.Game.findAll()
    return res.send(games)
  } catch (err) {
    console.error('There was an error querying games', err);
    return res.send(err);
  }
})

app.post('/api/games', async (req, res) => {
  const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
  try {
    const game = await db.Game.create({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
    return res.send(game)
  } catch (err) {
    console.error('***There was an error creating a game', err);
    return res.status(400).send(err);
  }
})

app.delete('/api/games/:id', async (req, res) => {
  try {
    const game = await db.Game.findByPk(parseInt(req.params.id))
    await game.destroy({ force: true })
    return res.send({ id: game.id  })
  } catch (err) {
    console.error('***Error deleting game', err);
    return res.status(400).send(err);
  }
});

app.put('/api/games/:id', async (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
  try {
    const game = await db.Game.findByPk(id)
    await game.update({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
    return res.send(game)
  } catch (err) {
    console.error('***Error updating game', err);
    return res.status(400).send(err);
  }
});

app.post('/api/games/search', async (req, res) => {
  const { name, platform } = req.body;

  try {
    if (platform == '' && name == '') {
      const games = await db.Game.findAll()
      return res.send(games)
    } else {
      const games = await db.Game.findAll({
        where: {
          platform: platform,
          name: {
                [Op.like]: '%' + name + '%'
            }
        }
      })
      return res.send(games)
    }

  } catch (err) {
    console.error('There was an error querying games', err);
    return res.send(err);
  }
});


app.get('/api/games/populate', async (req, res) => {
  try {
    var data = []

    const urlAndroid = 'https://interview-marketing-eng-dev.s3.eu-west-1.amazonaws.com/android.top100.json'
    const urlIos = 'https://interview-marketing-eng-dev.s3.eu-west-1.amazonaws.com/ios.top100.json'

    const [resAndroid, resIos] = await Promise.all([
        fetch(urlAndroid),
        fetch(urlIos)
    ]);

    const dataAndroid = await resAndroid.json();
    const dataIos = await resIos.json();

    const finalData = dataAndroid.concat(dataIos);

    for (var part in finalData) {
      for (var elem in finalData[part]) {
        item = finalData[part][elem]
        data.push({
          publisherId: item['publisher_id'],
          name: item['name'],
          platform: item['os'],
          storeId: item['appId'],
          bundleId: item['bundle_id'],
          appVersion: item['version'],
          isPublished: true,
          createdAt: new Date().toDateString(),
          updatedAt: new Date().toDateString(),
        })
      }
    }

    const games = await db.Game.bulkCreate(data)
    return res.send(games)

  } catch (err) {
    console.error('There was an error querying games', err);
    return res.send(err);
  }
});

app.listen(3000, () => {
  console.log('Server is up on port 3000');
});

module.exports = app;
