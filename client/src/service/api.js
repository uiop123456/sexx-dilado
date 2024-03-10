import axios from 'axios';
import { API_NOTIFICATION_MESSAGES, SERVICE_URLS } from '../constants/config';

const API_URL = 'http://localhost:8000/';

const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        "content-type": "application/json"
    }
});

axiosInstance.interceptors.request.use(
    (config) => {
        if(config.responseType.params){
            config.params = config.responseType.params
        }else if(config.TYPE.query){
            config.url = config.url+ '/' + config.TYPE.query
        }
        return config;
}, (error) => {
    return Promise.reject(error);
});

axiosInstance.interceptors.response.use((response) => {
    // stop global loader here
    return processResponse(response);
}, (error) => {
    return Promise.reject(processError(error)); 
});

/*
    if success -> return { isSuccess: true, data: object }
    if failed -> return { isFailure: true, status: string, msg: string, code: int }
*/

const processResponse = (response) => {
    if (response?.status === 200) {
        return {
            isSuccess: true,
            data: response.data
        }
    } else {
        return {
            isFailure: true,
            status: response?.status,
            msg: response?.msg,
            code: response?.code
        }
    }
};

// 3 types of error - response error and request error and network error
/*
    if success -> return { isSuccess: true, data: object }
    if failed -> return { isError: true, msg: string, code: int }
*/
const processError = async (error) => { // Fix: Accept 'error' instead of 'response'
    if (error.response) {
        // request made and server responded with another code
        // that falls out of the range 200-299
        console.log('error in response', error.toJSON);
        return {
            isError: true,
            msg: API_NOTIFICATION_MESSAGES.responseFailure,
            code: error.response.status
        };
    } else if (error.request) {
        // request made but no response was received
        // network issue connectivity issue
        console.log('error in request', error.toJSON);
        return {
            isError: true,
            msg: API_NOTIFICATION_MESSAGES.requestFailure,
            code: ""
        };
    } else {
        // something happens in setting up the request that triggers an error
        console.log('error in network', error.toJSON);
        return {
            isError: true,
            msg: API_NOTIFICATION_MESSAGES.networkError,
            code: ""
        };
    }
};

const API = {};

for (const [key, value] of Object.entries(SERVICE_URLS)) {
    API[key] = (body, showUploadProgress, showDownloadProgress) => {
        axiosInstance({
            method: value.method,
            url: value.url,
            data: value.method === 'DELETE' ? '':body,
            responseType: value.responseType,
            onUploadProgress: function (progressEvent) {
                if (showUploadProgress) {
                    let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    showUploadProgress(percentCompleted);
                }
            },
            onDownloadProgress: function (progressEvent) {
                if (showDownloadProgress) {
                    let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    showDownloadProgress(percentCompleted);
                }
            }
        });
    };
}

export { API };
