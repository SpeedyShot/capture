import pLimit, { Limit } from 'p-limit';
import axios, { AxiosResponse } from 'axios';

type CaptureOutputType = 'jpeg' | 'webp' | 'png' | 'pdf' | 'text' | 'html';
export interface CaptureParameters {
    output: CaptureOutputType;
    url?: string;
    htmlContent?: string;
    encoding?: 'inline';
    fullPage?: boolean;
    clip?: CaptureParameterClip;
    width?: number;
    height?: number;
    scale?: number;
    omitBackground?: boolean;
    captureBeyondViewport?: boolean;
    isMobile?: boolean;
    hasTouch?: boolean;
    isLandscape?: boolean;
    printBackground?: boolean;
    pdfFormat?: 'a0' | 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 'Letter' | 'Legal' | 'Tabloid' | 'Ledger';
    quality?: number;
    authentication?: CaptureParameterAuthentication;
    cookies?: CaptureParameterCookie[];
    headers?: any;
    geolocation?: CaptureParameterGeolocation;
    userAgent?: string;
    waitForItems?: (string | number)[];
    disableJavascript?: boolean;
    enableOfflineMode?: boolean;
    loadUntil?: 'networkidle2' | 'networkidle0' | 'load' | 'domcontentloaded';
    proxy?: string;
    consoleOutput?: boolean;
    extraScripts?: CaptureParameterExtraScript[];
    extraStyles?: CaptureParameterExtraStyle[];
    storageAuthKey?: string;
    storageAuthSecretKey?: string;
    storageBucket?: string;
    storageFilePath?: string; // Mandatory for bulk requests
}

export interface CaptureParameterAuthentication {
    username: string;
    password: string;
}
export interface CaptureParameterCookie {
    name: string;
    value: string;
    url?: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax';
}
export interface CaptureParameterGeolocation {
    latitude: number;
    longitude: number;
}
export interface CaptureParameterExtraScript {
    url?: string;
    content?: string;
}
export interface CaptureParameterExtraStyle {
    url?: string;
    content?: string;
}

export interface CaptureParameterClip {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CaptureOptions {
    maxConcurrency?: number;
    customServiceUrl?: string;
    customServiceEndpoint?: string;
    includeRawResponse?: boolean;
}

export interface CaptureOutput {
    result: any;
    metaData: CaptureOutputMetaData;
    raw?: AxiosResponse;
}

export interface CaptureOutputMetaData {
    creditsLeftBeforeRequest: number;
    creditsRefillTimestamp: number;
    apiCallId: string;
    contentType: string;
    contentLength: number;
    rateLimitMaxPerSecond: number;
    rateLimitRemaining: number;
}

// Storage settings are mandatory on bulk requests
// Otherwise, there is nowhere to store the results
type CaptureParametersBulk = Omit<CaptureParameters, 'output'>;
export interface CaptureBulkGlobalConfig extends CaptureParametersBulk {
    output?: CaptureOutputType;
    storageAuthKey: string;
    storageAuthSecretKey: string;
    storageBucket: string;
}

export class SpeedyShotCapture {
    _apiKey: string;
    _maxConcurrency: number;
    _pLimit: Limit;
    _serviceBaseUrl: string = 'https://service.speedyshot.com';
    _serviceEndpoint: string = '/api/snap';
    _serviceBulkEndpoint: string = '/api/bulk';
    _includeRawResponse: boolean = false;

    constructor(apiKey: string, options: CaptureOptions = {}) {
        this._apiKey = apiKey;
        this._maxConcurrency = isNaN(Number(options.maxConcurrency)) ? 50 : Number(options.maxConcurrency);
        if (this._maxConcurrency > 100) {
            this._maxConcurrency = 100;
        }
        this._pLimit = pLimit(this._maxConcurrency);
        if (options.customServiceUrl) {
            this._serviceBaseUrl = options.customServiceUrl;
        }
        if (options.customServiceEndpoint) {
            this._serviceEndpoint = options.customServiceEndpoint;
        }
        if (options.includeRawResponse) {
            this._includeRawResponse = options.includeRawResponse;
        }
    }

    async captureSingle(parameters: CaptureParameters): Promise<CaptureOutput> {
        const response: AxiosResponse = await this._pLimit(() => {
            return axios.post(this._serviceBaseUrl + this._serviceEndpoint, parameters, {
                headers: {
                    authorization: this._apiKey,
                },
            });
        });

        return this._transformResponse(response);
    }

    /**
     * Use this library to send multiple requests to SpeedyShot in parallel
     * Use of the Bulk API (async) is recommended instead
     * @param requestsList An array of requests to send to SpeedyShot
     */
    captureMultiple(requestsList: CaptureParameters[]): Promise<CaptureOutput[]> {
        const promisesList = requestsList.map((parameters) => {
            return this.captureSingle(parameters);
        });

        return Promise.all(promisesList);
    }

    /**
     *
     * @param globalConfig This configuration is applied to all the requests
     * @param requestsList An array of requests to send to SpeedyShot
     */
    async captureBulk(globalConfig: CaptureBulkGlobalConfig, requestsList: CaptureParameters[]): Promise<CaptureOutput> {
        const bulkRequestBody = {
            config: globalConfig,
            items: requestsList
        };
        const response = await axios.post(this._serviceBaseUrl + this._serviceBulkEndpoint, bulkRequestBody, {
            headers: {
                authorization: this._apiKey,
            },
        });
        return this._transformResponse(response);
    }

    _transformResponse(response: AxiosResponse): CaptureOutput {
        return {
            result: response.data,
            metaData: {
                creditsLeftBeforeRequest: parseInt(response.headers['x-credits-remaining-before'], 10),
                creditsRefillTimestamp: parseInt(response.headers['x-credits-refill-timestamp'], 10),
                apiCallId: response.headers['x-api-call-id'],
                contentType: response.headers['content-type'],
                contentLength: parseInt(response.headers['content-length'], 10),
                rateLimitMaxPerSecond: parseInt(response.headers['x-ratelimit-limit'], 10),
                rateLimitRemaining: parseInt(response.headers['x-ratelimit-remaining'], 10),
            },
            raw: this._includeRawResponse ? response : undefined,
        };
    }
}
