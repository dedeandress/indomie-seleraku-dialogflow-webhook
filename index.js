'use strict';
const express = require('express');
const PORT = process.env.PORT || 5000
const bodyParser = require('body-parser');
const {dialogflow, BrowseCarousel, BrowseCarouselItem, Image} = require('actions-on-google');
const fetch = require('node-fetch');
const { URL, URLSearchParams } = require('url');

const app = dialogflow();

const urlAccessToken = new URL('https://www.bukalapak.com/auth_proxies/request_token?scope=public%20user');
const urlBukalapakProduct = new URL('https://api.bukalapak.com/products');

app.intent('Cari Indomie', async(conv, parameter) => {  
  const namaIndomie = parameter['nama_indomie'];
  
  return new Promise(function(resolve, reject){
    if(namaIndomie.toLowerCase().includes('indomie')){
      return fetch(urlAccessToken, {method: 'POST'})
      .then(res =>res.json())
      .then(body => {
        console.log(body);
        const accessToken = body['access_token'];

        const params = {
          access_token: accessToken,
          keywords: namaIndomie,
          limit: 10,
          offset: 0
        };
        urlBukalapakProduct.search = new URLSearchParams(params).toString();

        return fetch(urlBukalapakProduct, {method: 'GET'})
          .then(response => response.json())
          .then((body) => {
            const obj = JSON.parse(JSON.stringify(body));

            const products = [];
            for(var i=0; i<obj.data.length; i++){
              products[i] = new BrowseCarouselItem({
                title: obj.data[i].name,
                description: obj.data[i].store.name,
                url: obj.data[i].url,
                image: new Image({
                  url :obj.data[i].images.large_urls[0],
                  alt : `Gambar ${obj.data[i].name}`
                }),
                footer: `Rp. ${obj.data[i].price}`
              });              
            }

            conv.ask(`Ini ${namaIndomie} buat kamu yang tersedia di Bukalapak`);
            conv.ask(new BrowseCarousel({
              items: products
            }));

            resolve();
          }).catch( (err) => {
            reject(err);
          });
      })
      .catch( (err) => {
          reject(err);
      });
    }else {
      conv.ask(`${namaIndomie} tidak ditemukan coba yang lain yaa`);
      resolve();
    }
    
  });
    
});

const expressApp = express().use(bodyParser.json());
expressApp.get('/ping', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.json({status:'success', payload:{message:'Server OKAY'}});
});

expressApp.post('/webhook',app);

expressApp.listen(PORT);
