import http from 'k6/http';
import { sleep } from 'k6';
import { check } from 'k6';
import { SharedArray } from 'k6/data';
import { parseHTML } from 'k6/html';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';


const BASE_URL = 'http://webtours.load-test.ru:1080';

export let options = {
    vus: 1,
    duration: '3s',
};

const dataCredentials = new SharedArray('users', function () {
    // here you can open files, and then do additional processing or generate the array with data dynamically
    const credentials = JSON.parse(open('./resources/users.json'));
    return credentials; // f must be an array[]
  });

const csvArrivalCity = new SharedArray('arrivalCity', function () {
    // Load CSV file and parse it using Papa Parse
    return papaparse.parse(open('./resources/arrivalCity.csv'), { header: true }).data;
  });

const csvDepartureCity = new SharedArray('departureCity', function () {
    // Load CSV file and parse it using Papa Parse
    return papaparse.parse(open('./resources/departureCity.csv'), { header: true }).data;
  });

const today = new Date()
let tomorrow = new Date()
let afterTomorrow = new Date()
tomorrow.setDate(today.getDate() + 1)
afterTomorrow.setDate(tomorrow.getDate() + 1)
let tomDate = tomorrow.toLocaleDateString('en-US', {year: 'numeric', month: '2-digit', day: '2-digit'});
let afterTomDate = afterTomorrow.toLocaleDateString('en-US', {year: 'numeric', month: '2-digit', day: '2-digit'});



export default function() {

    const getWebtoursStartPage = http.get(`${BASE_URL}/webtours`);
    check(getWebtoursStartPage, {'status code is 200': (getWebtoursStartPage) => getWebtoursStartPage.status === 200})

    const getHeader = http.get(`${BASE_URL}/webtours/header.html`);
    check(getHeader, {'status code is 200': (r) => r.status === 200})

    const getWelcome = http.get(`${BASE_URL}/cgi-bin/welcome.pl?signOff=true`);
    check(getWelcome, {'status code is 200': (r) => r.status === 200})

    const getUserId = http.get(`${BASE_URL}/cgi-bin/nav.pl?in=home`);
    check(getUserId, {'status code is 200': (r) => r.status === 200})
    const doc = parseHTML(getUserId.body);
    const pageTitle = doc.find('head title').text();
    console.log(pageTitle)
    const userSession = doc.find('input').attr('value');
    console.log(userSession)

    const getHome = http.get(`${BASE_URL}/WebTours/home.html`);
    check(getHome, {'status code is 200': (r) => r.status === 200})

    console.log(dataCredentials[0].login)

    let dataAuthenticate = { 
        userSession: userSession,
        username: dataCredentials[0].login,
        password: dataCredentials[0].password,
        "login.x": 0,
        "login.y": 0,
        JSFormSubmit: "off"
     };
    const authenticate = http.post(`${BASE_URL}/cgi-bin/login.pl`, dataAuthenticate);
    check(authenticate, {'status code is 200': (r) => r.status === 200})
    let doc2 = parseHTML(authenticate.body);
    let pageTitle2 = doc2.find('head title').text();
    console.log(pageTitle2);

    sleep(1);
    const getHomeAfterAction = http.get(`${BASE_URL}/cgi-bin/nav.pl?page=menu&in=home`);
    check(getHomeAfterAction, {'status code is 200': (r) => r.status === 200})

    const getMenu = http.get(`${BASE_URL}/cgi-bin/login.pl?intro=true`);
    check(getMenu, {'status code is 200': (r) => r.status === 200})

    const getFlight = http.get(`${BASE_URL}/cgi-bin/nav.pl?page=menu&in=flights`);
    check(getFlight, {'status code is 200': (r) => r.status === 200})

    const getReservations = http.get(`${BASE_URL}/cgi-bin/reservations.pl?page=welcome`);
    check(getReservations, {'status code is 200': (r) => r.status === 200})

    console.log(tomDate)
    console.log(afterTomDate)
    console.log(csvArrivalCity)
    const randomArrivalCity = csvArrivalCity[Math.floor(Math.random() * csvArrivalCity.length)];
    const randomDepartureCity = csvDepartureCity[Math.floor(Math.random() * csvDepartureCity.length)];


    console.log('Random city: ', randomArrivalCity.arrivalCity);
    console.log('Random city: ', randomDepartureCity.departureCity);


    let dataFlight = { 
        advanceDiscount: 0,
        depart: randomDepartureCity.departureCity,
        departDate: tomDate,
        arrive: randomArrivalCity.arrivalCity,
        returnDate: afterTomDate,
        numPassengers: 1,
        seatPref: null,
        seatType: "Coach",
        "findFlights.x": 36,
        "findFlights.y": 4,
        ".cgifields": "roundtrip",
        ".cgifields": "seatType",
        ".cgifields": "seatPref"
     };
    const postFlight = http.post(`${BASE_URL}/cgi-bin/reservations.pl`, dataFlight);
    check(postFlight, {'status code is 200': (r) => r.status === 200})
    let doc3 = parseHTML(postFlight.body);
    let pageTitle3 = doc3.find('head title').text();
    console.log(pageTitle3);
    const flightValue = doc3.find('input').attr('value');

    console.log(flightValue)

    let dataFlightCost = { 
        outboundFlight: flightValue,
        numPassengers: 1,
        advanceDiscount: 0,
        seatType: "Coach",
        seatPref: null,
        "reserveFlights.x": 16,
        "reserveFlights.y": 3,
     };
    const postSelectFlightCost = http.post(`${BASE_URL}/cgi-bin/reservations.pl`, dataFlightCost);
    check(postSelectFlightCost, {'status code is 200': (r) => r.status === 200})
    let doc4 = parseHTML(postSelectFlightCost.body);
    let pageTitle4 = doc3.find('head title').text();
    console.log(pageTitle4);


    let dataFlightInvoice = { 
        firstName: dataCredentials[0].firstName,
        lastName: dataCredentials[0].lastName,
        address1: dataCredentials[0].address1,
        address2: dataCredentials[0].address2,
        pass1: `${dataCredentials[0].firstName} ${dataCredentials[0].lastName}`,
        creditCard: dataCredentials[0].creditCard,
        expDate: dataCredentials[0].expDate,
        oldCCOption: "",
        numPassengers: 1,
        seatPref: null,
        seatType: "Coach",
        outboundFlight: flightValue,
        advanceDiscount: 0,
        returnFlight: "",
        JSFormSubmit: "off",
        "buyFlights.x": 57,
        "buyFlights.y": 1,
        ".cgifields": "saveCC"
     };
    const postFlightInvoice = http.post(`${BASE_URL}/cgi-bin/reservations.pl`, dataFlightInvoice);
    check(postFlightInvoice, {'status code is 200': (r) => r.status === 200})
    let doc5 = parseHTML(postFlightInvoice.body);
    let pageTitle5 = doc3.find('head title').text();
    console.log(pageTitle5);

    const getMenusPage = http.get(`${BASE_URL}/cgi-bin/welcome.pl?page=menus`);
    check(getMenusPage, {'status code is 200': (r) => r.status === 200})

    const getHomeAfterAction2 = http.get(`${BASE_URL}/cgi-bin/nav.pl?page=menu&in=home`);
    check(getHomeAfterAction2, {'status code is 200': (r) => r.status === 200})

    const getMenu2 = http.get(`${BASE_URL}/cgi-bin/login.pl?intro=true`);
    check(getMenu2, {'status code is 200': (r) => r.status === 200})

}