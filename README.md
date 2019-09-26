# Spam Your Congressman

This application allows users to automate calls to their house congressman by sending a text message to a specified phone number. Its aim is to make it as easy as possible to ensure your congressman hears your message. Despite the name, it's not actually going to spam anyone :)

This application is currently deployed at https://spam-your-congressman.herokuapp.com/

You can try out the app by texting anything to +1 (614)-347-1893. 

It will guide you through a workflow to obtain your address (to lookup your congressional district) and your message. It will make repeated phone calls to your representative until someone picks up the phone and your messaged is relayed. The application will notify you once it has successfully reached your representative.

## Installation

All you should need to do is run `npm`:

```
npm install
```

Alternatively, you can build the application in docker:

```
docker build .
```

## Configuration

All of the data assets come bundled in the `data` folder, so you shouldn't need to run any scripts to run the application. You will, however, need to set a number of environment variables. You can do this inside a file named [.env](https://www.freecodecamp.org/news/nodejs-custom-env-files-in-your-apps-fa7b3e67abe1/).

| Environment Variable   | Contents                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| TWILIO_ACCOUNT_SID     | The account ID for your Twilio account                                                                                    |
| TWILIO_MAKE_CALL_URL   | A URL that [twilio](https://www.twilio.com/) uses for incoming calls. This should be your host/makeCall                   |
| PORT                   | The port this application should run on                                                                                   |
| GOOGLE_API_KEY         | A Google cloud API key with access to the [geocode API](https://developers.google.com/maps/documentation/geocoding/start) |
| PORT                   | The port this application should run on                                                                                   |
| TWILIO_OUTGOING_NUMBER | The number Twilio will make calls from                                                                                    |

## Build

```
yarn build
```

## Develop

```
yarn dev
```

## Start Built Code

```
yarn start
```
