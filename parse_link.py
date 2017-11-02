import codecs
import json
from html.parser import HTMLParser


class LinkParser(HTMLParser):
    def __init__(self):

        HTMLParser.__init__(self)
        self.links = {}
        self.linkurl = ''

    def handle_starttag(self, tag, attrs):

        if tag == 'a':
            attrs = dict(attrs)
            if 'href' in attrs:
                self.linkurl = attrs['href']

    def handle_data(self, data):

        if self.linkurl:
            self.links[self.linkurl] = data
            self.linkurl = ''


def main():
    parser = LinkParser()

    with codecs.open('data/selected/device-tweets.json', 'r') as f:
        tweets = json.load(f)
        for i in range(len(tweets)):
            parser.feed(tweets[i]['source'])
            tweets[i]['source'] = parser.links.copy()
            parser.links.clear()

    with codecs.open('data/selected/device-tweets.json', 'w') as f:
        json.dump(tweets, f, ensure_ascii=False)


if __name__ == '__main__':
    main()
