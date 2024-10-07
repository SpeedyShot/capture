![@speedyshot/capture on NPM](https://img.shields.io/npm/v/@speedyshot/capture)

# @SpeedyShot/Capture

A TypeScript Library for using the SpeedyShot Service.

## Features

This library provides an interface to the SpeedyShot service, clearly describing the expected parameters using
TypeScript.

Furthermore, it also automatically throttles your requests to avoid hitting the max rate limit.

## Installation

`npm install @speedyshot/capture`

## Usage

### Single requests
```javascript
import { SpeedyShotCapture } from '@speedyshot/capture';

// Replace your api key in the constructor
// You can get an api key at https://speedyshot.com for free
const speedyShotCapture = new SpeedyShotCapture('YOUR-API-KEY');

// For single requests
const result = await speedyShotCapture.captureSingle({
    // Adjust to your desired capture parameters
    url: 'https://speedyshot.com',
    output: 'jpeg'
});
```

### Multiple requests
```javascript
import { SpeedyShotCapture } from '@speedyshot/capture';

// Replace your api key in the constructor
// You can get an api key at https://speedyshot.com for free
const speedyShotCapture = new SpeedyShotCapture('YOUR-API-KEY');

// For multiple requests
const parameters = {
    // Adjust to your desired capture parameters
    url: 'https://speedyshot.com',
    output: 'jpeg'
};

// In a real scenario, you would be using different parameters for each request
const results = await speedyShotCapture.captureMultiple([parameters, parameters]);
```

### With custom options
```javascript
import { SpeedyShotCapture } from '@speedyshot/capture';

// Replace your api key in the constructor
// You can get an api key at https://speedyshot.com for free
const customOptions = {
    // Max. concurrent requests.
    // Default is 50, min is 1, max is 100
    maxConcurrency: 75,
     
    // Include the raw axios response?
    // The result object will contain a 'raw' field with the AxiosResponse object
    includeRawResponse: true
};
const speedyShotCapture = new SpeedyShotCapture('YOUR-API-KEY', customOptions);

// For single requests
const result = await speedyShotCapture.captureSingle({
    // Adjust to your desired capture parameters
    url: 'https://speedyshot.com',
    output: 'jpeg'
});
```

# Changelog
## 1.2.1 - 07/10/2024
- Maintenance update

## 1.2.0 - 01/05/2024
- Added support for `storageRegion`, `storageEndpoint` parameters so S3-Compatible storage can be used, for example Wasabi.

## 1.1.0 - 28/04/2024
- Added support for `hideAds`, `hideCookieBanners`, and `useSpeedyProxy` features.
- Upgraded dependencies

## 1.0.0 - 21/02/2024
- Methods slightly refactored for readability with async instead of plain promises.
- CaptureBulk method added

## License
[MIT](https://choosealicense.com/licenses/mit/)

## Author
*@speedyshot/capture* is made by [SpeedyShot by CreateMyTech](https://speedyshot.com).