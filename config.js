// config

module.exports = {
    token: 'YourTokenBot',
    clientId: 'YourClientIdBot',
    WEB_SERVICE_BASE_URL: 'http://127.0.0.1:3000',
    SECRET_KEY: '1234', // Set your secret key here This Key is very important, complexity is better than simple key.
    // import fivecord.sql first and setup this config
    dbConfig: {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'fivecord',
      },

      //Rcon Config for connect to your server:
      RconipServer: '127.0.0.1',
      RconPassword: 'changeme',

  };
  
