# Insomnia BSON

The goal of this plugin is to make working with BSON endpoints as simple as working with JSON endpoints.

To send a BSON body from Insomnia:

- Make a new request with a JSON body.
- Add the header `x-use-bson`
- Send the request

The request will be serialized to a buffer using BSON encoding, saved to a temporary directory, and the raw binary will be sent as the body of your request. The content-type of the request will be set to `application/bson`.

## Adding binary buffers into your request:

- Compose a JSON body as usual
- In the value of the field which you want to be a binary, enter opening and closing quotes.
- Inside of the quotes, press control-space on your keyboard to bring up Insomnia's template selector.
- Choose one of the two options this plugin provides: "Buffer (from a string)" or "Buffer (from a file)".
- Click on the bubble that the editor inserted, and specify the value you want to send.

"Buffer (from a string)" will let you insert a string that will get converted to a buffer (UTF-8 encoded) before the request is serialzed to BSON.

"Buffer (from a file)" will allow you to pick a file from disk whose bytes will get loaded as a buffer into the request body before it is serialized to BSON.

## Parsing responses:

The plugin looks for responses with a `content-type` of `application/bson`. When it encounters one, the body is deserialized, and any Buffers found on the request body will be turned into Base64 strings before rendering in the Insomnia UI.

## Credits

I found the logo image on a Web site with free Figma assets somewhere. I don't remember who the artist was, but big thanks to them for providing it!
