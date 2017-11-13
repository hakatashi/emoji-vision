# A_D4

Members: 紺野瑛介, 高橋光輝

You can visit the site [here!](http://hakata-public.s3-website-ap-northeast-1.amazonaws.com/infovis/)

## Build

### Prerequisites

* Python >= 3.5
* Node.js >= 9
* GNU Make

### Install libraries

```sh
python -m pip install -r requirements.txt
npm install
```

### Build

```sh
make data/emoji_codepoints.json
npm run build
```
