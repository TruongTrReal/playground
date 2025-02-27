# get-screen-resolution

> Get your screen's resolution

Works on 
- Windows
- MacOS
- Linux (requires ImageMagick `apt-get install imagemagick`)

## Usage

```js
import { getResolution } from 'get-screen-resolution'

const resolution = await getResolution();
// e.g. { width: 1920, height: 1080 }
```

## API

### `Resolution`
```
{
  width: number,
  height: number
}
```
### `getResolution(): Promise<Resolution>`
Resolves to an object containing screen's width and height

