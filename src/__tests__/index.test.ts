import { CaptureOutput, SpeedyShotCapture } from '../index';
import axios, { AxiosResponse } from 'axios';

// Regular request mock
const successAxiosResponse: AxiosResponse = {
    status: 200,
    statusText: 'success',
    data: {
        fileUrl: 'dummyUrl',
    },
    headers: {
        'x-credits-remaining-before': '100',
        'x-credits-refill-timestamp': '1642932140',
        'x-api-call-id': 'xyz-123',
        'content-type': 'application/json',
        'content-length': '1200',
        'x-ratelimit-limit': '100',
        'x-ratelimit-remaining': '99',
    },
    // @ts-ignore
    config: {
    },
};
const successOutput: CaptureOutput = {
    result: {
        fileUrl: 'dummyUrl',
    },
    metaData: {
        contentLength: 1200,
        contentType: 'application/json',
        creditsLeftBeforeRequest: 100,
        creditsRefillTimestamp: 1642932140,
        rateLimitMaxPerSecond: 100,
        rateLimitRemaining: 99,
        apiCallId: 'xyz-123',
    },
};

// Bulk Request (async) mock
const bulkSuccessAxiosResponse: AxiosResponse = {
    status: 200,
    statusText: 'success',
    data: {
        'information': 'Bulk request sent for processing.',
        'warning': 'Bulk requests cannot be stopped once sent for processing.',
        'itemsSentForProcessing': 2,
        'creditsRemainingAfterProcessing': 1875,
    },
    headers: {
        'x-credits-remaining-before': '100',
        'x-credits-refill-timestamp': '1642932140',
        'x-api-call-id': 'xyz-123',
        'content-type': 'application/json',
        'content-length': '1200',
        'x-ratelimit-limit': '100',
        'x-ratelimit-remaining': '99',
    },
    // @ts-ignore
    config: {
    },
};
const bulkSuccessOutput: CaptureOutput = {
    result: {
        'information': 'Bulk request sent for processing.',
        'warning': 'Bulk requests cannot be stopped once sent for processing.',
        'itemsSentForProcessing': 2,
        'creditsRemainingAfterProcessing': 1875,
    },
    metaData: {
        contentLength: 1200,
        contentType: 'application/json',
        creditsLeftBeforeRequest: 100,
        creditsRefillTimestamp: 1642932140,
        rateLimitMaxPerSecond: 100,
        rateLimitRemaining: 99,
        apiCallId: 'xyz-123',
    },
};

describe('Given Speedyshot Capture', () => {
    const apiKey = 'dummy-api-key';
    const captureService = new SpeedyShotCapture(apiKey);
    const axiosPostMock = jest.spyOn(axios, 'post');

    describe('When using the single capture and it succeeds', () => {
        test('Then we should get a result', async () => {
            axiosPostMock.mockResolvedValueOnce(successAxiosResponse);
            const result = await captureService.captureSingle({
                url: 'dummy',
                output: 'jpeg',
            });
            expect(captureService._maxConcurrency).toBe(50);
            expect(result).toEqual(successOutput);
        });
    });

    describe('When using the single capture with a ceiled maxConcurrency and it succeeds', () => {
        const customCaptureService = new SpeedyShotCapture(apiKey, {
            maxConcurrency: 101,
        });
        test('Then we should get a result', async () => {
            axiosPostMock.mockResolvedValueOnce(successAxiosResponse);
            const result = await customCaptureService.captureSingle({
                url: 'dummy',
                output: 'jpeg',
            });
            expect(customCaptureService._maxConcurrency).toBe(100);
            expect(result).toEqual(successOutput);
        });
    });

    describe('When using the single capture with all options and it succeeds', () => {
        const customServiceUrl = 'https://myservice';
        const customServiceEndpoint = '/api/custom/snap';
        const maxConcurrency = 20;
        const customCaptureService = new SpeedyShotCapture(apiKey, {
            customServiceUrl,
            customServiceEndpoint,
            maxConcurrency,
            includeRawResponse: true,
        });

        test('Then we should get a result', async () => {
            axiosPostMock.mockResolvedValueOnce(successAxiosResponse);
            const result = await customCaptureService.captureSingle({
                url: 'dummy',
                output: 'jpeg',
            });

            expect(customCaptureService._maxConcurrency).toBe(maxConcurrency);
            expect(customCaptureService._serviceEndpoint).toBe(customServiceEndpoint);
            expect(customCaptureService._serviceBaseUrl).toBe(customServiceUrl);
            expect(result).toEqual({ ...successOutput, raw: successAxiosResponse });
        });
    });

    describe('When using the single capture and it fails', () => {
        test('Then we should get a failure', async () => {
            const error = 'dummyerror';
            axiosPostMock.mockImplementationOnce(() => {
                throw new Error(error);
            });
            expect.assertions(1);
            expect(
                captureService.captureSingle({
                    url: 'dummy',
                    output: 'jpeg',
                }),
            ).rejects.toThrow(error);
        });
    });

    describe('When using the multi capture and it succeeds', () => {
        test('Then we should get multiple results', async () => {
            axiosPostMock.mockResolvedValueOnce(successAxiosResponse);
            axiosPostMock.mockResolvedValueOnce(successAxiosResponse);
            const result = await captureService.captureMultiple([
                {
                    url: 'dummy',
                    output: 'jpeg',
                },
                {
                    url: 'dummy',
                    output: 'jpeg',
                },
            ]);
            expect(result).toEqual([successOutput, successOutput]);
        });
    });

    describe('When using the multi capture and it fails', () => {
        test('Then we should get a failure', async () => {
            const error = 'dummyerror';
            axiosPostMock.mockResolvedValueOnce(successAxiosResponse);
            axiosPostMock.mockImplementationOnce(() => {
                throw new Error(error);
            });
            expect.assertions(1);
            expect(
                captureService.captureMultiple([
                    {
                        url: 'dummy',
                        output: 'jpeg',
                    },
                    {
                        url: 'dummy',
                        output: 'jpeg',
                    },
                ])
            ).rejects.toThrow(error);
        });
    });

    describe('When submitting a bulk request and it fails', () => {
        test('Then we should get a failure', async () => {
            const error = 'dummyerror';
            axiosPostMock.mockImplementationOnce(() => {
                throw new Error(error);
            });
            expect.assertions(1);
            expect(
              captureService.captureBulk({
                  storageAuthKey: 'a',
                  storageAuthSecretKey: 'a',
                  storageBucket: 'a'
              }, [
                  {
                      url: 'dummy',
                      output: 'jpeg',
                      storageFilePath: '/myFolder/myFile.jpeg'
                  },
                  {
                      url: 'dummy-2',
                      output: 'jpeg',
                      storageFilePath: '/myFolder/myFile-2.jpeg'
                  },
              ])
            ).rejects.toThrow(error);
        });
    });

    describe('When submitting a bulk request and it succeeds', () => {
        test('Then we should get a success message with information', async () => {
            axiosPostMock.mockResolvedValueOnce(bulkSuccessAxiosResponse);
            const result = await captureService.captureBulk({
                storageAuthKey: 'a',
                storageAuthSecretKey: 'a',
                storageBucket: 'a'
            }, [
                {
                    url: 'dummy',
                    output: 'jpeg',
                    storageFilePath: '/myFolder/myFile.jpeg'
                },
                {
                    url: 'dummy-2',
                    output: 'jpeg',
                    storageFilePath: '/myFolder/myFile-2.jpeg'
                },
            ]);
            expect(captureService._maxConcurrency).toBe(50);
            expect(result).toEqual(bulkSuccessOutput);
        });
    });
});
