find data -type f -name "*.json" | xargs jq '[.[] | select(.geo != null) | {geo, created_at, emojis, text}]' |  jq -s -c add > geo-tweets.json
