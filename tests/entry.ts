import '../src/index'; // Load the api itself
import axios, { AxiosError } from 'axios';

(async() => {
    console.log('Running tests...');

    console.log('Testing GET request...');
    const response = await axios.get('http://localhost:3000/ping');

    console.log('Response:', response.data);
    if (response.data.data !== 'pong') throw new Error('GET request failed - data mismatch');
    console.log('GET request passed');

    console.log('Testing POST request...');
    const postResponse = await axios.post('http://localhost:3000/ping');
    console.log('Response:', postResponse.data);

    if (postResponse.data.data !== 'pong') throw new Error('POST request failed - data mismatch');
    console.log('POST request passed');

    try {
        console.log('Testing invalid GET request...');
        await axios.get('http://localhost:3000/ping/invalid');

        throw new Error('Success');
    } catch (e) {
        if (e == 'Error: Success') throw new Error('Invalid GET request did not throw error');
        if (!(e instanceof AxiosError)) throw new Error('Invalid GET request did not return AxiosError');
        if (!e.response || e.response.status !== 404) throw new Error('Invalid GET request did not return 404');
        console.log('Invalid GET request passed');
    }

    process.exit(0); // Exit the process with success (kill the server)
})();