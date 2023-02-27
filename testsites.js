import http from 'k6/http';
import { check } from 'k6';
import { parseHTML } from 'k6/html';


const YANDEX = 'https://ya.ru';
const WWW = 'http://wwww.ru';


export let options = {
    scenarios: {
        yaru:{
            executor: 'ramping-arrival-rate',
            startRate: 1,
            timeUnit: '1m',
            preAllocatedVUs: 1,
            maxVUs: 10,
            exec: "getYandex",
            stages: [
                { target: 60, duration: '5m' },
                { target: 60, duration: '10m' },
                { target: 72, duration: '5m' },
                { target: 72, duration: '10m' },
              ],
        },
        wwwru:{
            executor: 'ramping-arrival-rate',
            startRate: 1,
            timeUnit: '1m',
            preAllocatedVUs: 1,
            maxVUs: 20,
            exec: "getWww",
            stages: [
            { target: 120, duration: '5m' },
            { target: 120, duration: '10m' },
            { target: 144, duration: '5m' },
            { target: 144, duration: '10m' },
              ], 
        },

    }
    
};

export function getYandex() {

    const getYandexPage = http.get(YANDEX);
    check(getYandexPage, {'status code is 200': (r) => r.status === 200})
    let doc1 = parseHTML(getYandexPage.body);
    let pageTitle1 = doc1.find('body input').text();
    console.log(pageTitle1);
}

export function getWww() {

    const getWwwPage = http.get(WWW);
    check(getWwwPage, {'status code is 200': (r) => r.status === 200})
    let doc2 = parseHTML(getWwwPage.body);
    let pageTitle2 = doc2.find('head title').text();
    console.log(pageTitle2);
}
