import codecs
import json
import os
from html.parser import HTMLParser

DEVICE_TWEETS_DIR = './data/selected/device-tweets'


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

    for year in os.listdir(DEVICE_TWEETS_DIR):

        lang_year_path = os.path.join(DEVICE_TWEETS_DIR, year)

        for month in os.listdir(lang_year_path):

            lang_month_path = os.path.join(lang_year_path, month)

            for file in os.listdir(lang_month_path):

                file_path = os.path.join(lang_month_path, file)
                with codecs.open(file_path, 'r+') as f:
                    tweets = json.load(f)
                    for i in range(len(tweets['tweets'])):
                        parser.feed(tweets['tweets'][i]['source'])
                        tweets['tweets'][i]['source'] = \
                            list(parser.links.copy().values())[0]
                        parser.links.clear()

                    for i in range(len(tweets['stats'])):
                        stat = []
                        for k, v in tweets['stats'][i]['device_stat'].items():
                            parser.feed(k)
                            stat.append(
                                {'source': list(parser.links.copy().values())[
                                    0], 'count': v})
                            parser.links.clear()

                        tweets['stats'][i]['device_stat'] = stat

                    f.seek(0)
                    json.dump(tweets, f, ensure_ascii=False)
                    f.truncate()


if __name__ == '__main__':
    main()
