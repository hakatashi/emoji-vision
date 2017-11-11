import json


def main():
    with open('data/emoji-groups.json', 'r') as f:
        emoji_groups = json.load(f)

    emoji_codepoints = {}
    for emoji in emoji_groups:
        emoji_codepoint = emoji['codepoint']
        emoji.pop('codepoint')
        emoji_codepoints[emoji_codepoint] = emoji

    with open('data/emoji_codepoints.json', 'w') as f:
        json.dump(emoji_codepoints, f)


if __name__ == '__main__':
    main()