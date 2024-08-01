const fs = require('fs');
const path = require('path');
const { DOMParser } = require('xmldom');
const toGeoJSON = require('./toGeoJSON'); // Ensure this path is correct

// Read the GPX file
const gpxFilePath = path.join(__dirname, 'test.gpx');
fs.readFile(gpxFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the GPX file:', err);
        return;
    }

    // Parse the GPX file and convert it to GeoJSON
    const parser = new DOMParser();
    const gpxData = parser.parseFromString(data, 'application/xml');
    const geoJSON = toGeoJSON.gpx(gpxData);

    // Write the GeoJSON to a file in a single-line format
    const geoJSONString = JSON.stringify(geoJSON);
    const geoJSONFilePath = path.join(__dirname, 'test.geojson');
    fs.writeFile(geoJSONFilePath, geoJSONString, (err) => {
        if (err) {
            console.error('Error writing the GeoJSON file:', err);
            return;
        }
        console.log('GeoJSON file has been saved to', geoJSONFilePath);
    });
});
