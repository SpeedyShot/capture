import pLimit, { Limit } from 'p-limit';
import axios, { AxiosResponse } from 'axios';

export interface CaptureParameters {
    output: 'jpeg' | 'webp' | 'png' | 'pdf' | 'text' | 'html';
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
    waitForItems?: CaptureParameterWaitForItem[];
    disableJavascript?: boolean;
    enableOfflineMode?: boolean;
    loadUntil?: 'networkidle2' | 'networkidle0' | 'load' | 'domcontentloaded';
    proxy?: string;
    consoleOutput?: boolean;
    extraScripts?: CaptureParameterExtraScript[];
    extraStyles?: CaptureParameterExtraStyle[];
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
export interface CaptureParameterWaitForItem {
    type: 'selector' | 'timeout';
    value: string | number;
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

export class SpeedyShotCapture {
    _apiKey: string;
    _maxConcurrency: number;
    _pLimit: Limit;
    _serviceBaseUrl: string = 'https://service.speedyshot.com';
    _serviceEndpoint: string = '/api/snap';
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

    captureSingle(parameters: CaptureParameters): Promise<CaptureOutput> {
        return this._pLimit(() => {
            return axios.post(this._serviceBaseUrl + this._serviceEndpoint, parameters, {
                headers: {
                    authorization: this._apiKey,
                },
            });
        }).then((response: AxiosResponse) => {
            return this._transformResponse(response);
        });
    }

    captureMultiple(parametersList: CaptureParameters[]): Promise<CaptureOutput[]> {
        const promisesList = parametersList.map((parameters) => {
            return this.captureSingle(parameters);
        });

        return Promise.all(promisesList);
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
