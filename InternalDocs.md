# Internal API docs
This is pretty much useless to anyone but me, but I'm putting it here anyway because tbh i forgot how to use it and am too lazy to look at the code on the internal api

## Assumptions
- Axios is defined as `axios`
- .env is loaded into `process.env`
- The environment is an async function

## Quick links
[Reading and writing files](#reading-and-writing-files)

# Reading and writing files
## Reading files
```javascript
const dataRes = await axios.get(`https://bot.daalbot.xyz/get/database/read`, {
    headers: {
        'Authorization': process.env.BotCommunicationKey,
        'bot': 'Discord',
        'path': `/path/to/file`,
    }
});

const data = dataRes.data;
```

## Writing files
```javascript
const dataRes = await axios.post(`https://bot.daalbot.xyz/get/database/create`, {
    headers: {
        'Authorization': process.env.BotCommunicationKey,
        'bot': 'Discord',
        'path': `/path/to/file`,
        'data': 'Data to write',
        'type': 'file',
    }
});

const data = dataRes.data;
```